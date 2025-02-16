CREATE TABLE IF NOT EXISTS "filter_rules" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "from_pattern" TEXT,
  "to_pattern" TEXT,
  "subject_pattern" TEXT,
  "operator" VARCHAR(10) NOT NULL DEFAULT 'AND',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "filter_actions" (
  "id" SERIAL PRIMARY KEY,
  "rule_id" INTEGER REFERENCES "filter_rules"("id") ON DELETE CASCADE,
  "type" VARCHAR(50) NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "filter_rules_operator_idx" ON "filter_rules"("operator");
CREATE INDEX IF NOT EXISTS "filter_actions_rule_id_idx" ON "filter_actions"("rule_id");
CREATE INDEX IF NOT EXISTS "filter_actions_type_idx" ON "filter_actions"("type"); 