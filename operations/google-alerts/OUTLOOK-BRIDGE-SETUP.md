# Outlook reply bridge — prepared, NOT active

No Microsoft subscription or Entra directory required. Public contact remains vianovamarketing@outlook.com.

## Exact approval needed
1. Outlook rule: name Via Nova CRM replies; recipient vianovamarketing@outlook.com AND subject includes [VNM:; redirect to east.yorker111@gmail.com; except sender east.yorker111@gmail.com; do not run against existing inbox or stop other rules. Preserve originals. Use redirect, not manual forwarding, so From/To and subject are retained. Verify real received headers before claiming working.
2. Existing Via Nova Google Apps Script project: add gmail.readonly permission. This permission can read the Google mailbox; code restricts collection to the Outlook recipient and validates enquiry reference, matching customer sender, and test/live status. No customer mail is sent by the importer. Gmail receives copies including attachments; CRM stores bounded plain text only and private attachment references.

## Activation after approval
- Apply gmail-pending-schema.sql to the existing dedicated Marketing database only; verify tables.
- Publish the reviewed Worker with inherited bindings; leave flags off initially.
- Add OutlookBridge.gs to existing Google project. Add https://www.googleapis.com/auth/gmail.readonly to manifest, preserve every existing scope. Owner must approve scope expansion. Enable Gmail API for that project if necessary.
- Save the Outlook rule only after approval. Owner-permitted labelled incoming reply must prove redirected headers and exact destination. Do not use internal owner alert as customer-reply proof.
- Set GMAIL_PENDING_SCHEMA_READY, GMAIL_READ_AUTHORIZED, GMAIL_ROUTE_VERIFIED, GMAIL_OWNER_REVIEW_ENABLED and OUTLOOK_BRIDGE_ENABLED only after their evidence gates. Do not persist access tokens; the script supplies a short-lived token for each authenticated check.
- syncOutlookReplies performs one bounded page and preserves cursor/pending records. Install its five-minute trigger only after successful provider/storage preflight. Existing alerts trigger unchanged.
- Verify import once, replay without duplicate, original retention, wrong reference quarantine, excluded security/owner emails and a private CRM timeline.
- Update CRM status only after end-to-end receipt. Pausing/deleting only the new sync trigger and disabling OUTLOOK_BRIDGE_ENABLED stops collection without deleting records.

## Current state
Source and tests prepared locally. No Outlook rule, Gmail permission, new schedule, database migration or live bridge activation has been made. Prior manual CRM remains working. Microsoft account connection in Codex remains separate.

## Verification and handoff
82 automated tests passed before activation, including identity rejection, wrong mailbox, disabled flags, redacted errors and duplicate/import preservation tests. Outlook rule draft currently has subject [VNM: and Redirect to selected; Microsoft requires passkey verification before entering its destination. User confirmation requested for the exact Google destination and Gmail read scope. Rule is not saved. No scope, trigger, provider setting or live Worker was changed.
