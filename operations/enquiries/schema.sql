CREATE TABLE IF NOT EXISTS enquiries (
 id TEXT PRIMARY KEY,
 payload_hash TEXT NOT NULL,
 received_at TEXT NOT NULL,
 form_kind TEXT NOT NULL CHECK(form_kind IN ('quick','brief')),
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 business TEXT NOT NULL,
 message TEXT NOT NULL,
 is_test INTEGER NOT NULL DEFAULT 0,
 marketing_consent TEXT NOT NULL DEFAULT 'not_granted',
 owner_status TEXT NOT NULL DEFAULT 'New',
 owner_notes TEXT NOT NULL DEFAULT '',
 follow_up_due TEXT,
 synced_at TEXT,
 revision INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS owner_audit (
 id TEXT PRIMARY KEY,
 enquiry_id TEXT NOT NULL REFERENCES enquiries(id),
 changed_at TEXT NOT NULL,
 actor TEXT NOT NULL,
 previous_revision INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS enquiries_received ON enquiries(received_at);
CREATE TABLE IF NOT EXISTS notification_outbox (
 enquiry_id TEXT PRIMARY KEY REFERENCES enquiries(id),
 state TEXT NOT NULL DEFAULT 'pending_configuration',
 attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at TEXT,
 last_error TEXT
);

CREATE TABLE IF NOT EXISTS communication_messages (
 id TEXT PRIMARY KEY,
 enquiry_id TEXT NOT NULL REFERENCES enquiries(id),
 channel TEXT NOT NULL,
 direction TEXT NOT NULL,
 source TEXT NOT NULL,
 provider_message_id TEXT,
 provider_thread_id TEXT,
 occurred_at TEXT NOT NULL,
 recorded_at TEXT NOT NULL,
 body TEXT NOT NULL,
 delivery_state TEXT NOT NULL,
 workflow TEXT NOT NULL,
 project_reference TEXT NOT NULL DEFAULT '',
 invoice_reference TEXT NOT NULL DEFAULT '',
 payload_hash TEXT NOT NULL,
 UNIQUE(channel,provider_message_id)
);
CREATE INDEX IF NOT EXISTS communication_enquiry ON communication_messages(enquiry_id,recorded_at,id);
