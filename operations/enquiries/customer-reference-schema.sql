ALTER TABLE enquiries ADD COLUMN customer_reference TEXT NOT NULL DEFAULT '';
UPDATE enquiries SET customer_reference='VNM-C-'||lower(hex(randomblob(16))) WHERE customer_reference='';
ALTER TABLE owner_audit ADD COLUMN previous_customer_reference TEXT NOT NULL DEFAULT '';
ALTER TABLE owner_audit ADD COLUMN next_customer_reference TEXT NOT NULL DEFAULT '';
ALTER TABLE communication_messages ADD COLUMN sender_role TEXT NOT NULL DEFAULT 'not_specified';
ALTER TABLE communication_messages ADD COLUMN attachment_reference TEXT NOT NULL DEFAULT '';
