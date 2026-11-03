# Inbound email adapter - disabled, locally tested

The existing Code.gs sends minimal owner alerts every five minutes. Its explicit
manifest has no Gmail-read scope. No change to that script, its schedule or its
deployed permissions was made. Its identity token authenticates the notification
service; it is not Gmail API authorization.

`../enquiries/gmail-replies.mjs` reuses the existing `recordCommunication` writer.
It is not imported by the Worker and has no HTTP route. Nothing polls Gmail in
production. There are no new credentials, production tables, message sends or schedules. A separate local-only migration adds pending metadata, matching audit and page cursor tables to the same business database when activation is approved.

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
same UUID and immutable payload hash. Test/live categories cannot cross. Failed reads remain retryable by stable ID. Discovery advances only after each result has a durable pending record and the next cursor is saved; failed pending writes keep the prior cursor. Repeated successful imports are
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
4. Apply gmail-pending-schema.sql only to the selected authorized business store
   during activation. Pending metadata and discovery cursor are implemented and
   restart-tested locally. Preserve these tables in that activated backup/export
   process; the current production four-table backup is intentionally unchanged.
   Originals stay in Gmail; no read/archive/delete marking exists.
5. Verify real attachment permissions and a labelled permitted provider reply,
   then confirm storage, retry, wrong-business isolation and export readback.
6. Only after acceptance decide whether to extend the existing five-minute run.
   No new schedule is needed or authorized by this implementation.

Fifteen affected isolated SQLite tests cover disabled access, reference/threading,
duplicates/conflicts, participant/business isolation, metadata, failed writes and
lost receipt retries, restart-safe pending records and cursors, transactional audit,
revision conflicts, owner confirmation and unchanged live boundaries.
No live provider receipt or automatic mailbox synchronization is claimed.

Official API references checked 3 November 2026:
https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list
https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/get

## Durable owner review and replay (local disabled implementation)

Pending records contain mailbox/message/thread IDs, private source locator,
classification (unassigned or marketing), state/reason, timestamps, attempt count,
revision, source fingerprint and an explicitly linked enquiry if established.
They contain no correspondent name/email, subject, body or attachment bytes.

matchPendingReply requires a verified server-side owner context, explicit Marketing
confirmation, existing same-category enquiry, current revision and private evidence
reference. It saves prior/next enquiry and actor in the same transaction. Never pass
an owner context taken from untrusted request JSON. A future private owner UI/route
must use the existing authenticated boundary. No such public/live route exists.

replayPendingReply rechecks actual reader identity and fetches the unchanged original
by provider ID. The fingerprint rejects changed source content. Exact sender,
recipient, test/live and conflicting-business/reference checks still run after owner
matching; owner approval does not override those guards. No automatic name/phone
merge or enquiry creation. A committed message cannot be reassigned through this
queue, including after a lost receipt. For prior matching corrections before import,
use the new revision and record evidence; the audit preserves both links.

Discovery stores the next-page cursor only after every message has a durable
pending result. Pending/retry replay is separate from discovery so an unresolved
message does not starve later pages. Neither function schedules itself. Shared
WhatsApp receiver/registration remains wholly outside this Marketing-only module.
