-- Make guidelines optional (not required on campaign creation)
ALTER TABLE campaigns MODIFY COLUMN guidelines TEXT;

-- Campaign source videos (YouTube links)
CREATE TABLE IF NOT EXISTS campaign_sources (
  id VARCHAR(36) PRIMARY KEY,
  campaign_id VARCHAR(36) NOT NULL,
  youtube_url TEXT NOT NULL,
  youtube_video_id VARCHAR(50) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaign_sources_campaign ON campaign_sources(campaign_id);
