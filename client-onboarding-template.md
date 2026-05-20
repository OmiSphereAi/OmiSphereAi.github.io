# Exiga AI Communications — Client Onboarding Template

**Fill this out for every new client you onboard. Takes ~15 minutes.**

---

## CLIENT INFO

| Field | Value |
|-------|-------|
| Business Name | |
| Business Type | ☐ Medical/Dental  ☐ Spa/Wellness  ☐ Home Services  ☐ Other: |
| Contact Name | |
| Contact Email | |
| Contact Phone | |
| Billing Start Date | |
| Monthly Fee | $ |

---

## STEP 1 — Google Calendar Setup

1. Ask the client to share their Google Calendar with your service account, OR
2. Have them create a **new dedicated calendar** for appointments:
   - Google Calendar → + Other calendars → Create new calendar
   - Name it: `[Business Name] Appointments`
   - Share it with your Google account (give "Make changes to events" permission)
3. Get the **Calendar ID** (Settings → Share → scroll to Calendar ID)

```
GOOGLE_CALENDAR_ID = ________________________________
```

---

## STEP 2 — Twilio Phone Number

1. Log into your Twilio account
2. Buy Numbers → Search by area code matching the client's city
3. Purchase a local number (~$1.15/mo)
4. **Your markup:** charge client $15–25/mo for the number

```
TWILIO_FROM_NUMBER = +1__________________________
```

---

## STEP 3 — n8n Workflow Setup

1. In n8n Cloud: **Workflows → vapi-ai-receptionist → Duplicate**
2. Rename to: `[Business Name] - AI Receptionist`
3. Update environment variables for THIS workflow only:

```
GOOGLE_CALENDAR_ID      = (from Step 1)
TWILIO_FROM_NUMBER      = (from Step 2)
BUSINESS_TIMEZONE       = ________________________________
                          Options: America/Denver (MST) | America/Chicago (CST)
                                   America/New_York (EST) | America/Los_Angeles (PST)
BUSINESS_START_HOUR     = ____  (e.g. 8 or 9)
BUSINESS_END_HOUR       = ____  (e.g. 17 or 18)
BUSINESS_DAYS           = ____  (e.g. 1,2,3,4,5 for Mon-Fri or 1,2,3,4,5,6 for Mon-Sat)
SLOT_DURATION_MINUTES   = ____  (e.g. 30 or 60)
```

4. **Activate** the duplicated workflow
5. Copy the webhook URL from the Vapi Webhook Receiver node:

```
Webhook URL = https://app.n8n.cloud/webhook/________________________________
```

---

## STEP 4 — Vapi Assistant Setup

1. Vapi Dashboard → Assistants → **Create New Assistant**
2. Copy the system prompt from `vapi-assistant-config.json`
3. Replace ALL placeholder values:

```
{{BUSINESS_NAME}}             = ________________________________
{{BUSINESS_HOURS}}            = e.g. "Monday through Friday, 9 AM to 5 PM"
{{BUSINESS_TIMEZONE}}         = e.g. "Mountain"
{{SLOT_DURATION}}             = ____
{{DEFAULT_SERVICE}}           = e.g. "cleaning", "consultation", "estimate"
{{SERVICES_LIST}}             = e.g. "cleanings, fillings, exams, whitening"

{{BUSINESS_TYPE}} snippet     = ☐ medical_dental  ☐ spa_wellness  ☐ home_services
(paste the matching snippet from vapi-assistant-config.json → industry_system_prompt_snippets)

{{CUSTOM_INTAKE_QUESTIONS}}   = (leave blank OR add client-specific questions)
```

4. **Voice selection:**

| Business Type | Recommended Voice |
|--------------|------------------|
| Medical/Dental | Professional Female (Rachel) |
| Spa/Wellness | Warm Female (Bella) |
| Home Services | Professional Male (Adam) |
| Client preference | Ask them |

5. **First Message** — replace placeholder:
```
"Thank you for calling [BUSINESS NAME]. This is Alex. How can I help you today?"
```

6. **Server URL** — paste webhook URL from Step 3

7. Add all **4 tools** from `vapi-assistant-config.json → tools[]`
   - Set Server URL on each tool = same webhook URL

8. **Assign a phone number:**
   - Vapi → Phone Numbers → Buy Number (or port existing)
   - Assign to this assistant
   - **Your markup:** charge client $30–50/mo for the Vapi number

```
Vapi Phone Number = +1__________________________
```

---

## STEP 5 — Do the Reminder Workflow Too

1. Duplicate `vapi-reminder-scheduler` workflow
2. Rename: `[Business Name] - Reminders`
3. Set same env vars as main workflow
4. Activate

---

## STEP 6 — Test Before Going Live

Run these Postman tests against the client's webhook URL:

**Test 1 — Availability Check**
```json
POST https://app.n8n.cloud/webhook/[CLIENT-WEBHOOK-PATH]
{
  "message": {
    "type": "tool-calls",
    "toolCallList": [{"id": "t1", "type": "function", "function": {"name": "check_availability", "arguments": {"service": "[CLIENT SERVICE]"}}}],
    "call": {"id": "c1", "customer": {"number": "+17205550000"}}
  }
}
```
✅ Should return list of open slots

**Test 2 — Book Appointment**
```json
{
  "message": {
    "type": "tool-calls",
    "toolCallList": [{"id": "t2", "type": "function", "function": {"name": "book_appointment", "arguments": {
      "client_name": "Test Client",
      "client_phone": "+17205550001",
      "service": "[CLIENT SERVICE]",
      "datetime": "[TOMORROW AT 10AM ISO FORMAT]",
      "reason_for_visit": "Test booking",
      "is_first_time": true
    }}}],
    "call": {"id": "c2", "customer": {"number": "+17205550001"}}
  }
}
```
✅ Calendar event created + SMS received

**Test 3 — Call the Vapi number**
- Call the number, book a real test appointment
- Verify everything end-to-end

---

## STEP 7 — Client Handoff

Send the client:
- Their new phone number
- A short demo video of the AI in action (record Loom of a test call)
- What to expect: confirmation texts, 24h reminders, calendar sync

**Do NOT give the client:**
- n8n access
- Vapi dashboard access
- Any Exiga AI backend details

---

## NOTES / CUSTOM CONFIGS FOR THIS CLIENT

```
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## COST BREAKDOWN (Your Profit Estimate)

| Item | Your Cost | Charge Client | Monthly Profit |
|------|-----------|--------------|----------------|
| n8n Cloud (per workflow) | ~$5 | included in setup | — |
| Twilio number | $1.15 | $15–25 | ~$14–24 |
| Twilio SMS (~200/mo) | ~$1.60 | included | — |
| Vapi (per minute, varies) | $0.05/min | included in retainer | — |
| Setup fee (one-time) | 2h labor | $300–500 | $300–500 |
| Monthly retainer | 1h support | $200–400 | ~$200–400 |
| **Total monthly** | | | **~$214–424/client** |
