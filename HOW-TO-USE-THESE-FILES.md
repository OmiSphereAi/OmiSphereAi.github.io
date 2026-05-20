# Exact n8n Setup Instructions for Exiga AI

---

## FILE 1 — vapi-ai-receptionist.json
**This is your main workflow. Import this first.**

### How to import:
1. Go to **app.n8n.cloud** and log in
2. Click **"Workflows"** in the left sidebar
3. Click the **"+ Add workflow"** button (top right)
4. An empty workflow opens — now click the **three dots menu "..."** at the very top right of the screen (next to the "Save" button)
5. Click **"Import from file"**
6. Select `vapi-ai-receptionist.json`
7. The workflow loads with ~31 nodes — you will see red warning icons on nodes. That is normal — it means credentials are missing.

### After importing — fix credentials (required or it won't work):

You need to do this on EVERY Google Calendar and Twilio node:

**Google Calendar nodes (there are 5 of them):**
- Names: "Get Calendar Events", "Create Calendar Event", "Search Events for Reschedule", "Search Events for Cancel", "Update Calendar Event", "Delete Calendar Event"
- Click each one → on the right panel find **"Credential for Google Calendar OAuth2 API"** → click the dropdown → select your Google credential (or click "Create new credential" if you haven't set one up yet)

**To create Google Calendar credential (one time):**
1. Click any Google Calendar node
2. Click the credential dropdown → "Create new credential"
3. It opens a popup — enter your Google Client ID and Client Secret (from Google Cloud Console)
4. Click "Sign in with Google" → authorize
5. Save it as "Google Calendar - Exiga AI"
6. Now go back and set this same credential on ALL other Google Calendar nodes

**Twilio nodes (there are 3 of them):**
- Names: "Send Booking Confirmation SMS", "Send Reschedule SMS", "Send Cancellation SMS"
- Click each one → find **"Credential for Twilio API"** → select or create
- To create: enter your Twilio Account SID + Auth Token → save as "Twilio - Exiga AI"

### After fixing credentials — set environment variables:

Click the **Settings icon (gear ⚙️)** in the left sidebar → **"Variables"**

Add these one by one (click "+ Add variable" each time):

| Name | Value |
|------|-------|
| GOOGLE_CALENDAR_ID | primary |
| TWILIO_FROM_NUMBER | +1XXXXXXXXXX (your Twilio number) |
| BUSINESS_TIMEZONE | America/Denver |
| BUSINESS_START_HOUR | 9 |
| BUSINESS_END_HOUR | 17 |
| BUSINESS_DAYS | 1,2,3,4,5 |
| SLOT_DURATION_MINUTES | 30 |

### Activate the workflow:
- Top right of workflow editor → toggle the switch from **"Inactive" to "Active"**
- The workflow is now live and listening

### Get your webhook URL:
- Click the node named **"Vapi Webhook Receiver"**
- On the right panel you will see **"Production URL"** — copy this entire URL
- It looks like: `https://app.n8n.cloud/webhook/vapi-receptionist`
- **This is what you paste into Vapi**

---

## FILE 2 — vapi-reminder-scheduler.json
**This sends 24-hour reminder texts. Import separately.**

### How to import:
1. Go back to **Workflows** list
2. Click **"+ Add workflow"** again
3. Three dots menu → **"Import from file"**
4. Select `vapi-reminder-scheduler.json`

### Fix credentials (same as above):
- Click "Get Upcoming Events" node → set Google Calendar credential
- Click "Mark Reminder Sent" node → set Google Calendar credential
- Click "Send Reminder SMS" node → set Twilio credential

### Set environment variables:
Same variables as File 1 — if you already set them in n8n Settings → Variables, they carry over automatically.

### Activate it:
Toggle to **Active**. It will now run every hour automatically.

---

## FILE 3 — vapi-assistant-config.json
**Do NOT import this into n8n. This is a reference file only.**

Open it in any text editor (Notepad, VS Code, etc.) and use it to set up your Vapi assistant:

### Step 1 — Create the assistant in Vapi:
1. Go to **dashboard.vapi.ai**
2. Click **"Assistants"** → **"Create Assistant"**
3. Give it a name: e.g. "Alex - [Client Business Name]"

### Step 2 — Paste the system prompt:
1. Find the `systemPrompt` value inside the file
2. Copy the entire text between the quotes
3. Paste it into the **"System Prompt"** box in Vapi
4. Replace every `{{PLACEHOLDER}}` with real values for your client (see the template file)

### Step 3 — Set the model:
- Provider: **OpenAI**
- Model: **gpt-4o**
- Temperature: **0.4**

### Step 4 — Set the voice:
Pick one from the `voice_options` section of the config file.
For most clients start with `professional_female_elevenlabs` (Rachel).

### Step 5 — Add the 4 tools:
In Vapi → your assistant → **"Tools"** tab:
- Click **"Add Tool"** → **"Function"**
- Copy the name, description, and parameters from each tool in the `tools[]` array
- Do this 4 times: check_availability, book_appointment, reschedule_appointment, cancel_appointment
- On each tool set **Server URL** = your n8n webhook URL from File 1

### Step 6 — Set the server URL on the assistant itself:
- In Vapi assistant settings → **"Server URL"** field
- Paste the same n8n webhook URL

### Step 7 — Assign a phone number:
- Vapi → **"Phone Numbers"** → buy a number → assign it to this assistant

---

## FILE 4 — client-onboarding-template.md
**Open this in any text editor or Google Docs.**

This is your checklist to fill out every time you onboard a new client.
Print it or copy it into a Google Doc. Fill in the blanks as you go through each step.

---

## FILE 5 — SETUP.md
**Read this in any text editor or Markdown viewer.**

Full setup guide with troubleshooting. Use this if something isn't working.

---

## Quick Test After Setup

Once everything is active, send this to your n8n webhook URL using a browser or Postman:

**Method:** POST
**URL:** (your n8n webhook URL)
**Body (JSON):**
```
{
  "message": {
    "type": "tool-calls",
    "toolCallList": [{
      "id": "test-1",
      "type": "function",
      "function": {
        "name": "check_availability",
        "arguments": {}
      }
    }],
    "call": {
      "id": "call-1",
      "customer": { "number": "+17205550000" }
    }
  }
}
```

**What you should get back:**
```
{"results":[{"toolCallId":"test-1","result":"I have the following times available: ..."}]}
```

If you get that response — everything is working. Call your Vapi number and test live.
