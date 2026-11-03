
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
