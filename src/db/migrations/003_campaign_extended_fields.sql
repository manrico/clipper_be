-- Add extended campaign fields: budget, platforms, language, deadline
ALTER TABLE campaigns ADD COLUMN budget DECIMAL(12,2) NULL AFTER payout_fixed;
ALTER TABLE campaigns ADD COLUMN platforms JSON NULL AFTER budget;
ALTER TABLE campaigns ADD COLUMN language VARCHAR(50) NULL AFTER platforms;
ALTER TABLE campaigns ADD COLUMN deadline DATE NULL AFTER language;
