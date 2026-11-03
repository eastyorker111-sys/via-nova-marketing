# Inbound email adapter - disabled, locally tested

The existing Code.gs sends minimal owner alerts every five minutes. Its explicit
manifest has no Gmail-read scope. No change to that script, its schedule or its
deployed permissions was made. Its identity token authenticates the notification
service; it is not Gmail API authorization.

`../enquiries/gmail-replies.mjs` reuses the existing `recordCommunication` writer.
It is not imported by the Worker and has no HTTP route. Nothing polls Gmail in
production. There are no new credentials, tables, message sends or schedules.

The adapter accepts full Gmail message responses through an injected read-only
reader. `account()` must return the authenticated mailbox identity; `list()` and
`get()` must implement the official Gmail message API. It requires explicit enable,
verified owner mailbox and verified Marketing recipient before any read. These
configuration assertions are not themselves proof of owner authorization.

Routing requires an exact [VNM:enquiry UUID] subject or an already verified-import
thread mapped to exactly one Marketing enquiry, plus exact enquiry sender email
and single Marketing recipient. Unknown/ambiguous/mismatched/forwarded messages
remain unassigned in the original mailbox. A matching From header is routing
evidence, not cryptographic sender authentication or scope/payment approval.
No name/phone matching, new customer creation or owner-field update occurs.

Stable IDs are namespaced by mailbox and Gmail message ID; retries reuse the
same UUID and immutable payload hash. Test/live categories cannot cross. Failed
reads/writes never advance the bounded page. Repeated successful imports are
idempotent. Unsupported HTML-only/oversized/MIME messages require source review;
no text is silently truncated. Attachment references locate the private original;
files are neither fetched nor made accessible by this adapter.

Activation gates, in order:
1. Verify the actual hello@ mailbox/forward destination; current owner Gmail search
   found no eligible customer replies. Agree the specific permitted message set.
2. Obtain explicit authorization for the concrete mailbox reader and Gmail-read
   scope. Do not change the existing alert script manifest to force a grant.
3. Wire a supported authenticated reader and receiver with mailbox identity
   verification. Never put an admin secret in browser code or ordinary documents.
4. Persist unmatched/retry review outcomes in the selected authorized source
   before advancing its cursor. Current return values are NOT a durable quarantine
   or scheduler. Originals stay in Gmail; no read/archive/delete marking exists.
5. Verify real attachment permissions and a labelled permitted provider reply,
   then confirm storage, retry, wrong-business isolation and export readback.
6. Only after acceptance decide whether to extend the existing five-minute run.
   No new schedule is needed or authorized by this implementation.

Eight new isolated SQLite tests cover disabled access, explicit/reference threading,
duplicates/conflicts, participant/business isolation, attachment metadata, failed
writes/lost receipt retries, pagination/read failures and unchanged live boundaries.
No live provider receipt or automatic mailbox synchronization is claimed.

Official API references checked 3 November 2026:
https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list
https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/get
