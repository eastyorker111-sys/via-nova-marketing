-- Local disabled adapter migration. NOT applied to production.
CREATE TABLE IF NOT EXISTS gmail_pending_replies (
 provider_key TEXT PRIMARY KEY,
 mailbox TEXT NOT NULL,
 message_id TEXT NOT NULL,
 thread_id TEXT,
 source_reference TEXT NOT NULL,
 classification TEXT NOT NULL DEFAULT 'unassigned' CHECK(classification IN ('unassigned','marketing')),
 state TEXT NOT NULL DEFAULT 'pending',
 reason TEXT NOT NULL DEFAULT '',
 message_hash TEXT,
 enquiry_id TEXT REFERENCES enquiries(id),
 revision INTEGER NOT NULL DEFAULT 0,
 first_seen TEXT NOT NULL,
 last_seen TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS gmail_reply_match_audit (
 id TEXT PRIMARY KEY,
 provider_key TEXT NOT NULL REFERENCES gmail_pending_replies(provider_key),
 actor TEXT NOT NULL,
 changed_at TEXT NOT NULL,
 previous_revision INTEGER NOT NULL,
 previous_enquiry_id TEXT,
 next_enquiry_id TEXT NOT NULL REFERENCES enquiries(id),
 evidence_reference TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS gmail_reply_cursor (
 mailbox TEXT PRIMARY KEY,
 page_token TEXT,
 revision INTEGER NOT NULL DEFAULT 0,
 last_checked TEXT NOT NULL
);
