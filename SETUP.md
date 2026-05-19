# AI Receptionist Setup Guide
### Vapi + n8n + Google Calendar + Twilio

---

## What You're Setting Up

A voice AI receptionist ("Alex") that:
- Answers phone calls via **Vapi**
- Books, reschedules, and cancels appointments in **Google Calendar**
- Sends real-time SMS confirmations and updates via **Twilio**
- Automatically sends **24-hour reminder texts** to clients

---

## Files in This Repo

| File | Purpose |
|------|---------|
| `workflows/vapi-ai-receptionist.json` | Main n8n workflow — import this first |
| `workflows/vapi-reminder-scheduler.json` | 24h reminder workflow — import separately |
| `vapi-assistant-config.json` | Vapi assistant + tool definitions reference |

---

## Prerequisites

- **n8n** instance (n8n Cloud or self-hosted with HTTPS)
- **Vapi** account (vapi.ai)
- **Google Cloud** project with Calendar API enabled + OAuth2 credentials
- **Twilio** account with a phone number

---

## Step 1 — Set Up Google Calendar OAuth2 in n8n

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Go to **APIs & Services → Library** → enable **Google Calendar API**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URI: `https://YOUR_N8N_HOST/rest/oauth2-credential/callback`
5. Copy the **Client ID** and **Client Secret**
6. In n8n: **Settings → Credentials → New → Google Calendar OAuth2 API**
   - Paste Client ID and Client Secret
   - Click **Sign in with Google** and authorize
   - Name it: `Google Calendar OAuth2`
   - Save and note the credential **ID**

---

## Step 2 — Set Up Twilio in n8n

1. Log in to [Twilio Console](https://console.twilio.com)
2. Get your **Account SID** and **Auth Token** from the dashboard
3. Note your **Twilio phone number** (the `From` number for SMS)
4. In n8n: **Settings → Credentials → New → Twilio API**
   - Enter Account SID and Auth Token
   - Name it: `Twilio API`
   - Save and note the credential **ID**

---

## Step 3 — Set Environment Variables in n8n

Go to **n8n Settings → Environment Variables** and add:

```
GOOGLE_CALENDAR_ID      = primary
TWILIO_FROM_NUMBER      = +1XXXXXXXXXX   (your Twilio number)
BUSINESS_TIMEZONE       = America/New_York
BUSINESS_START_HOUR     = 9
BUSINESS_END_HOUR       = 17
BUSINESS_DAYS           = 1,2,3,4,5     (1=Mon, 7=Sun)
SLOT_DURATION_MINUTES   = 30
```

> **Per-client deployments:** Give each client their own n8n workflow copy with their own env vars. This is how you white-label the service.

---

## Step 4 — Import Workflows into n8n

### Main Workflow
1. In n8n: **Workflows → New → Import from file**
2. Select `workflows/vapi-ai-receptionist.json`
3. After import, update credentials:
   - Open each **Google Calendar** node → set credential to `Google Calendar OAuth2`
   - Open each **Twilio** node → set credential to `Twilio API`
4. **Activate** the workflow (toggle in top-right)
5. Note your webhook URL: `https://YOUR_N8N_HOST/webhook/vapi-receptionist`

### Reminder Workflow
1. Import `workflows/vapi-reminder-scheduler.json`
2. Update credentials on Google Calendar and Twilio nodes
3. **Activate** the workflow

---

## Step 5 — Test the Webhook with Postman

Before connecting Vapi, test each branch directly.

**Check Availability:**
```json
POST https://YOUR_N8N_HOST/webhook/vapi-receptionist
Content-Type: application/json

{
  "message": {
    "type": "tool-calls",
    "toolCallList": [{
      "id": "test-001",
      "type": "function",
      "function": {
        "name": "check_availability",
        "arguments": { "service": "Consultation" }
      }
    }],
    "call": { "id": "call-001", "customer": { "number": "+15551234567" } }
  }
}
```

Expected response:
```json
{
  "results": [{
    "toolCallId": "test-001",
    "result": "I have the following times available: ..."
  }]
}
```

**Book Appointment:**
```json
{
  "message": {
    "type": "tool-calls",
    "toolCallList": [{
      "id": "test-002",
      "type": "function",
      "function": {
        "name": "book_appointment",
        "arguments": {
          "client_name": "Jane Smith",
          "client_phone": "+15559876543",
          "service": "Initial Consultation",
          "datetime": "2026-05-20T14:00:00-04:00",
          "notes": "First time client, referred by Dr. Jones"
        }
      }
    }],
    "call": { "id": "call-002", "customer": { "number": "+15559876543" } }
  }
}
```

Verify: event appears in Google Calendar + SMS delivered in Twilio logs.

---

## Step 6 — Set Up Vapi Assistant

1. Log in to [Vapi Dashboard](https://dashboard.vapi.ai)
2. Go to **Assistants → Create Assistant**
3. Configure:

**Model Settings:**
- Provider: OpenAI, Model: `gpt-4o`
- System Prompt: Copy from `vapi-assistant-config.json` → `assistant.model.systemPrompt`
- Replace `{{business_name}}`, `{{business_hours}}`, `{{slot_duration}}` with real values
- Temperature: 0.4

**Voice Settings:**
- Provider: ElevenLabs, Voice: Rachel (or your preferred voice)
- Alternatively: OpenAI TTS, voice "shimmer"

**Transcription:**
- Provider: Deepgram, Model: nova-2, Language: en-US

**First Message:**
```
Thank you for calling [Your Business Name]. This is Alex. How can I help you today?
```

**Server URL:**
```
https://YOUR_N8N_HOST/webhook/vapi-receptionist
```

4. Add **Tools** (one at a time in Vapi → Tools):
   - Copy each tool definition from `vapi-assistant-config.json` → `tools[]`
   - Set Server URL on each tool to your n8n webhook URL

5. **Assign a phone number** to the assistant in Vapi → Phone Numbers

---

## Step 7 — End-to-End Voice Test

1. Call your Vapi phone number
2. Test each scenario:
   - "I'd like to check availability for next week"
   - "I'd like to book an appointment for [name] on [date] at [time]"
   - "I need to reschedule my appointment" (use a name you just booked)
   - "I need to cancel my appointment"
3. Verify:
   - Google Calendar reflects changes
   - Client receives SMS for each action
   - 24h before any test appointment, reminder SMS is sent

---

## White-Labeling for Clients

To deploy for a new client:

1. **Duplicate** the main workflow in n8n (or use a new n8n workspace)
2. Update env vars: calendar ID, phone number, timezone, business hours
3. Update the Vapi system prompt with the client's business name and hours
4. Assign a new Vapi phone number to a new assistant for this client
5. **Done** — fully isolated deployment per client

---

## Troubleshooting

**Vapi gets no response / call drops:**
- Check n8n webhook is active and URL is HTTPS
- Verify n8n execution logs for errors
- Ensure all n8n credentials are authorized

**SMS not sending:**
- Check Twilio Console for message logs and error codes
- Verify `TWILIO_FROM_NUMBER` is your actual Twilio number in E.164 format
- Check Twilio account balance

**Calendar events not created:**
- Re-authorize Google Calendar credential in n8n (OAuth tokens expire)
- Verify `GOOGLE_CALENDAR_ID` is correct (`primary` or specific calendar ID)
- Check Google Cloud Console → API quotas

**Wrong time slots returned:**
- Verify `BUSINESS_TIMEZONE` matches the client's local timezone
- Check `BUSINESS_START_HOUR` / `BUSINESS_END_HOUR` are in 24h format
- Verify `BUSINESS_DAYS` is comma-separated ISO weekdays (1=Mon, 7=Sun)

**Reschedule/cancel can't find event:**
- The search uses client name against event summary
- Ensure booking follows naming convention: `[Service] - [Client Name]`
- Check that the calendar being searched is the same as `GOOGLE_CALENDAR_ID`
