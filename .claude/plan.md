# Plan: Polish Core Flows — Real-time Messaging, Notifications, Submissions, Scouting

## Problem Summary
The app has broken flows because:
1. **Applied/Shortlisted/Booked tabs are empty** — CastingsHub reads applications from the store, but the store never loads them from the DB
2. **Agency "Models" tab shows wrong content** — Should be "Scout" (browse all platform models), not "My Models"
3. **No way for agencies to invite models from Scout** — Missing "Invite to Roster" button
4. **Models can't see/accept agency invitations or casting offers** — Missing UI in inbox
5. **Messages aren't real-time** — No polling, messages only appear on page reload
6. **Seeded data creates confusion** — User wants a completely fresh start

## Complete Flow Maps

### Flow 1: Casting Application (Model → Creator)
```
Model browses Active castings
  → Clicks casting → Sees detail + "Apply Now"
  → 4-step application → Submit
  → DB: Submission(status=APPLIED) created
  → DB: Notification sent to casting creator
  → Model sees casting in Castings/Applied tab

Creator opens dashboard → Submissions tab
  → Sees model's application
  → Action: Shortlist
    → DB: Submission.status → SHORTLISTED
    → DB: Notification to model "You've been shortlisted"
    → Model: casting moves from Applied → Shortlisted tab
  → Action: Offer
    → DB: Submission.status → OFFERED
    → DB: Notification to model "You've received an offer!"
    → Model: offer appears in Inbox/Bookings with Accept/Decline
  → Action: Reject
    → DB: Submission.status → REJECTED
    → DB: Notification to model

Model accepts offer (from Inbox/Bookings):
  → DB: Submission.status → ACCEPTED
  → DB: Notification to creator "Model accepted"
  → Model: Inbox/Bookings shows "Awaiting confirmation"

Creator confirms booking:
  → DB: Submission.status → CONFIRMED
  → DB: Notification to model "Booking confirmed!"
  → Model: casting appears in Castings/Booked tab
```

### Flow 2: Agency Scouting (Agency → Model)
```
Agency goes to "Scout" tab
  → Sees ALL models on platform (not just roster)
  → Clicks model profile
  → Sees "Invite to Roster" button
  → Clicks invite
    → DB: AgencyApplication(status=INVITED) created
    → DB: Notification to model "Agency wants you!"

Model sees invitation in Inbox/Notifications
  → Accept: model joins agency roster, notification to agency
  → Decline: notification to agency
```

### Flow 3: Model Applies to Agency
```
Model visits agency profile → "Apply to [Agency]"
  → DB: AgencyApplication(status=APPLIED)
  → DB: Notification to agency

Agency sees in dashboard/notifications
  → Accept: model joins roster
  → Decline: notification to model
```

### Flow 4: Messaging (Any → Any)
```
User A visits User B's profile → "Message"
  → Conversation created (or existing one opened)
  → Redirected to Inbox/Messages with that conversation open
  → User types message → POST to API → stored in DB
  → Recipient sees it (via 3-second polling interval)
  → Unread badge updates on Inbox tab
```

## Implementation Steps

### Step 1: Clean seed — remove all pre-made data except accounts
- Modify seed.ts: keep account creation, remove all castings, submissions, posts, follows
- User starts fresh — all content is user-generated

### Step 2: Load applications from DB in store-context
- Add `loadApplications(userId)` that fetches from `/api/submissions/history`
- CastingsHub Applied/Shortlisted/Booked tabs will then work

### Step 3: Rename agency "Models" tab → "Scout"
- In app/page.tsx: change tab label and icon
- Scout tab renders ModelsBrowse (all platform models)
- Agency roster moves to brand-dashboard's "My Models" tab

### Step 4: Add "Invite to Roster" on model profiles (agency view)
- In profile-view (model/profile-view.tsx): when viewer is agency, show invite button
- Calls POST /api/agency/invite with modelId
- Sends notification to model

### Step 5: Add offer/invitation handling in Inbox
- Inbox/Bookings: fetch active offers from `/api/submissions/history?status=OFFERED`
- Show Accept/Decline buttons on each offer
- Inbox/Notifications: fetch agency invitations, show Accept/Decline

### Step 6: Real-time messaging with polling
- In ChatView: add `setInterval` polling every 3 seconds for new messages
- In conversation list: poll every 5 seconds for new conversations + unread counts
- Update unread badge on Inbox nav tab

### Step 7: Notification polling + unread badge
- In app shell: poll `/api/notifications?unread=true` every 10 seconds
- Update bell icon badge count
- Notifications list shows real DB notifications with timestamps

### Step 8: Wire all status change notifications
- Verify POST /api/submissions/[id]/status creates notifications for: SHORTLISTED, OFFERED, CONFIRMED, REJECTED
- Verify agency invite/accept creates notifications
- Verify casting application creates notification to creator
