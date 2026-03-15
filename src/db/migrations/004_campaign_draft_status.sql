-- Add 'draft' to campaign status enum and change default to 'draft'
ALTER TABLE campaigns MODIFY COLUMN status ENUM('draft', 'active', 'inactive', 'completed') NOT NULL DEFAULT 'draft';
