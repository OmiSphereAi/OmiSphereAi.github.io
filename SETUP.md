# Exiga AI Communications — Setup Guide
### Vapi + n8n Cloud + Google Calendar + Twilio

---

## YOUR STACK

| Tool | Your Account |
|------|-------------|
| **n8n** | n8n Cloud (app.n8n.cloud) |
| **Vapi** | Already set up ✅ |
| **Twilio** | Already set up ✅ |
| **Google Calendar** | One per client |
| **Timezone (default)** | MST — America/Denver |

---

## FILES IN THIS PACKAGE

| File | What it is |
|------|-----------|
| `workflows/vapi-ai-receptionist.json` | Main n8n workflow — import once, duplicate per client |
| `workflows/vapi-reminder-scheduler.json` | 24h reminder workflow — import once, duplicate per client |
| `vapi-assistant-config.json` | Vapi assistant template with all 4 tools + voice options |
| `client-onboarding-template.md` | **Your operational checklist — use this for every new client** |

---

## ONE-TIME SETUP (Do This Once)

### 1. Import Both Workflows into n8n Cloud

1. Log into [app.n8n.cloud](https://app.n8n.cloud)
2. **Workflows → New → Import from file**
3. Import `vapi-ai-receptionist.json`
4. Import `vapi-reminder-scheduler.json`
5. Keep both **inactive** for now — you'll activate per-client copies

### 2. Add Google Calendar Credential (One-Time)

1. [Google Cloud Console](https://console.cloud.google.com) → New Project: "Exiga AI Receptionist"
2. **APIs & Services → Library** → Enable **Google Calendar API**
3. **APIs & Services → Credentials → Create → OAuth 2.0 Client ID**
   - Type: Web Application
   - Redirect URI: `https://app.n8n.cloud/rest/oauth2-credential/callback`
4. Copy Client ID + Client Secret
5. n8n → **Settings → Credentials → New → Google Calendar OAuth2 API**
   - Name: `Google Calendar - Exiga AI`
   - Paste Client ID + Secret → Sign in with Google → Authorize
6. Note the credential ID — you'll use this on every workflow

### 3. Add Twilio Credential (One-Time)

1. [Twilio Console](https://console.twilio.com) → Account → Account Info
2. Copy Account SID + Auth Token
3. n8n → **Settings → Credentials → New → Twilio API**
   - Name: `Twilio - Exiga AI`
   - Paste Account SID + Auth Token → Save
4. Note the credential ID

### 4. Update Credentials on the Template Workflows

Open `vapi-ai-receptionist` workflow:
- Every **Google Calendar** node → set credential to `Google Calendar - Exiga AI`
- Every **Twilio** node → set credential to `Twilio - Exiga AI`

Do the same for `vapi-reminder-scheduler`.

These become your **master templates**. Never activate them directly — always duplicate.

---

## PER-CLIENT SETUP (15 Minutes Each)

Follow `client-onboarding-template.md` exactly for every client you onboard.

Quick summary:
1. Get their Google Calendar ID
2. Buy them a Twilio number (local area code, ~$1.15/mo → charge $15-25/mo)
3. Duplicate the n8n workflows, set their env vars, activate
4. Create a Vapi assistant, fill in their business details, add the 4 tools
5. Buy or assign Vapi phone number → charge $30-50/mo
6. Test with Postman, then do a live call test
7. Hand off — they never need to touch anything

---

## ENVIRONMENT VARIABLES REFERENCE

Set these on each **per-client** duplicated workflow (not on the master template).

Go to: **Workflow settings → Environment variables** OR set in n8n instance settings.

```
GOOGLE_CALENDAR_ID        Client's Google Calendar ID (e.g. "abc123@group.calendar.google.com")
TWILIO_FROM_NUMBER        Their dedicated Twilio number in E.164 (+17205551234)
BUSINESS_TIMEZONE         America/Denver (MST) for most your clients
BUSINESS_START_HOUR       Start of bookable hours, 24h format (9 = 9am)
BUSINESS_END_HOUR         End of bookable hours, 24h format (17 = 5pm)
BUSINESS_DAYS             Comma-separated ISO weekdays: 1=Mon ... 7=Sun
                          Mon-Fri = 1,2,3,4,5
                          Mon-Sat = 1,2,3,4,5,6
SLOT_DURATION_MINUTES     Default appointment length in minutes (30 or 60)
```

---

## VAPI SYSTEM PROMPT — QUICK SETUP

Open `vapi-assistant-config.json` and replace every `{{PLACEHOLDER}}`:

| Placeholder | Replace with |
|------------|-------------|
| `{{BUSINESS_NAME}}` | Client's exact business name |
| `{{BUSINESS_HOURS}}` | e.g. "Monday through Friday, 9 AM to 5 PM" |
| `{{BUSINESS_TIMEZONE}}` | e.g. "Mountain" |
| `{{SLOT_DURATION}}` | e.g. "30" |
| `{{DEFAULT_SERVICE}}` | e.g. "cleaning" or "consultation" |
| `{{SERVICES_LIST}}` | e.g. "cleanings, fillings, whitening, exams" |
| `{{BUSINESS_TYPE}}` | Paste matching snippet from `industry_system_prompt_snippets` |
| `{{CUSTOM_INTAKE_QUESTIONS}}` | Leave blank or add client-specific ones |

**Industry snippet locations in vapi-assistant-config.json:**
- Medical/Dental → `industry_system_prompt_snippets.medical_dental`
- Spa/Wellness → `industry_system_prompt_snippets.spa_wellness`
- Home Services → `industry_system_prompt_snippets.home_services`

---

## TESTING EACH CLIENT BEFORE GO-LIVE

Run this Postman check to confirm the webhook is working:

```
POST https://app.n8n.cloud/webhook/vapi-receptionist
Content-Type: application/json

{
  "message": {
    "type": "tool-calls",
    "toolCallList": [{
      "id": "test-001",
      "type": "function",
      "function": {
        "name": "check_availability",
        "arguments": {}
      }
    }],
    "call": {
      "id": "call-001",
      "customer": { "number": "+17205559999" }
    }
  }
}
```

You should get back:
```json
{ "results": [{ "toolCallId": "test-001", "result": "I have the following times available: ..." }] }
```

Then call the Vapi number and book a test appointment end-to-end.

---

## TROUBLESHOOTING

**AI not responding / call drops**
- Check n8n workflow is **Active**
- Verify webhook URL in Vapi matches exactly (copy from n8n node, not typed)
- n8n execution logs → check for errors

**SMS not sending**
- Twilio Console → Monitor → Logs — look for error codes
- Verify `TWILIO_FROM_NUMBER` matches your Twilio number exactly with +1
- Check Twilio account balance

**Calendar not updating**
- Re-authorize Google Calendar credential in n8n (Settings → Credentials → reconnect)
- Confirm the client shared the calendar and you have "Make changes" permission
- Check `GOOGLE_CALENDAR_ID` is correct (not "primary" if it's a shared calendar)

**Wrong times / slots off**
- Verify `BUSINESS_TIMEZONE` is correct for that client's city
- Verify `BUSINESS_START_HOUR` and `BUSINESS_END_HOUR` are correct
- MST = `America/Denver`, PST = `America/Los_Angeles`, CST = `America/Chicago`, EST = `America/New_York`

**Reschedule/cancel can't find appointment**
- Search uses client name against event title
- Events are titled `[Service] - [Client Name]` automatically
- Make sure the name the caller gives matches what was booked
