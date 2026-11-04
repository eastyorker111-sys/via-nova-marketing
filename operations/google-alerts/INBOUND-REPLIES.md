# Inbound email adapter - disabled, locally tested

The existing Code.gs sends minimal owner alerts every five minutes. Its explicit
manifest has no Gmail-read scope. No change to that script, its schedule or its
deployed permissions was made. Its identity token authenticates the notification
service; it is not Gmail API authorization.

`../enquiries/gmail-replies.mjs` reuses the existing `recordCommunication` writer.
The latest local Worker now imports it through the authenticated `/api/admin/replies`
route. The existing private Vercel app proxies that route at `/api/replies` and has
`/replies.html` owner controls. These changes are local and disabled by default;
they have NOT been deployed. Nothing polls Gmail in production. There are no new
credentials, production tables, message sends or schedules. A separate local-only
migration adds pending metadata, matching audit and page cursor tables to the same
business database when activation is approved.

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
   restart-tested locally. The local backup route includes these three tables in
   version 4 when GMAIL_PENDING_SCHEMA_READY=true; its seven-table restore was
   tested in disposable SQLite. With the flag absent it keeps version 3. The
   current production four-table backup remains unchanged.
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
an owner context taken from untrusted request JSON. The new local private owner
UI/route uses the existing admin-token boundary and fixed owner identity; it must
remain a single-owner Vercel-authenticated deployment. It is not a multi-user role
system. No such route is live yet.

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

## Installable manual reader and private review (local, not activated)

`gmail-reader.mjs` implements read-only Gmail REST profile/list/get. It rejects
wrong accounts, unscoped queries, arbitrary message IDs and oversized responses;
it follows no redirects, logs no tokens or message content, and reports expired
or denied access. It fetches at most five selected messages per manual page.
`gmail-review.mjs` exposes status/list, account check, one-page discovery, explicit
owner matching and retry behind existing admin authentication. Browser writes
also require the private app's same-origin and action header checks. POSTed actor
claims are ignored. No operation sends, deletes, archives or marks Gmail mail.

Activation variables (none set by this implementation):
- GMAIL_PENDING_SCHEMA_READY=true only after applying gmail-pending-schema.sql
  to the dedicated Marketing store and verifying its backup/restore.
- GMAIL_OWNER_REVIEW_ENABLED=true only on the protected single-owner deployment.
- GMAIL_READ_AUTHORIZED=true only after explicit authorization for this reader.
- GMAIL_ROUTE_VERIFIED=true only after actual hello@ delivery is demonstrated.
- GMAIL_ACCESS_TOKEN is a short-lived, Gmail-readonly OAuth access token supplied
  only through the server's protected secret mechanism. Never paste it into chat,
  the UI, documents or Git. No refresh credential or token broker is installed.
- GMAIL_TEST_MODE defaults off. Local tests use disposable fixtures, not customer
  records or an invented production test lead.

This is a manual acceptance transport, not unattended production OAuth. An access
token expiring is an explicit stop; no silent renewal or broader scope request.
Before deployment confirm the private host supports the route's bounded 55-second
request budget, keep Vercel Authentication on all deployments, apply the migration
and verify protected backup restore. Pause reads by unsetting GMAIL_READ_AUTHORIZED;
keep the schema-ready flag while tables contain records so backups still include
them. Matching can remain available with reader access off. Do not drop tables.

### Concrete authorization boundary and owner step

On 3 November the connected Gmail profile was east.yorker111@gmail.com. An exact
search for to:/deliveredto:/from:hello@vianovamarketing.ca returned zero message IDs.
That does not establish forwarding or prove there are no messages elsewhere.
The actual Marketing Apps Script editor showed the same owner and only openid,
userinfo.email, script.send_mail, script.external_request and script.scriptapp.
Its existing grant cannot supply Gmail-reading access; connector search access
cannot be exported or treated as a background application credential.

First owner action: identify/confirm where hello@ actually delivers and provide
one already-existing eligible Marketing message reference, or separately approve
a labelled delivery test. Do not send that test without authorization.

After route verification, present the exact OAuth client/app and consent screen
for this manual reader under east.yorker111@gmail.com. The minimum content-reading
scope is https://www.googleapis.com/auth/gmail.readonly (no modify/send/full-mail).
It technically allows reading the entire mailbox, not just Marketing; our scoped
query and message guards narrow application behavior, not Google's permission.
The owner must explicitly approve that concrete new access at the consent step.
No OAuth client registration, token grant, script scope change or consent action
was performed here. A supported secure token provisioning path and durable OAuth
renewal choice remain activation work; do not call this a live connection.

Official scope/profile references:
https://developers.google.com/workspace/gmail/api/auth/scopes
https://developers.google.com/workspace/gmail/api/reference/rest/v1/users/getProfile

New checks: six reader/route/proxy/backup integration tests and three UI draft
preservation tests passed. Reused the prior 15 recovery tests without rerunning.
Chrome synthetic flow exercised discovery, unassigned review, refresh protection,
explicit matching and import retry. None is an actual provider delivery receipt.
