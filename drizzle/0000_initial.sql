CREATE TABLE IF NOT EXISTS "filter_rules" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "from_pattern" VARCHAR(255),
  "to_pattern" VARCHAR(255),
  "subject_pattern" VARCHAR(255),
  "body_pattern" TEXT,
  "is_enabled" BOOLEAN DEFAULT true,
  "priority" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "filter_actions" (
  "id" SERIAL PRIMARY KEY,
  "rule_id" INTEGER REFERENCES "filter_rules"("id") ON DELETE CASCADE,
  "action_type" VARCHAR(50) NOT NULL,
  "config" JSONB NOT NULL,
  "is_enabled" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 