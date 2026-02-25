import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("No DATABASE_URL or POSTGRES_URL found");
  process.exit(1);
}

const sql = neon(connectionString);

async function createSchema() {
  console.log("Creating schema...");

  await sql`
    CREATE TABLE IF NOT EXISTS theses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      size_range TEXT,
      funding_stage TEXT,
      geography TEXT,
      technologies TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("Created theses table");

  await sql`
    CREATE TABLE IF NOT EXISTS targets (
      id TEXT PRIMARY KEY,
      thesis_id TEXT NOT NULL,
      name TEXT NOT NULL,
      one_liner TEXT,
      stage TEXT,
      headcount TEXT,
      signal_score INTEGER DEFAULT 0,
      top_signal TEXT,
      fit_rating TEXT,
      client_overlap_current TEXT,
      client_overlap_potential TEXT,
      product_rating TEXT,
      product_score INTEGER,
      valuation TEXT,
      funding_stage_detail TEXT,
      current_investors TEXT,
      last_updated TIMESTAMPTZ DEFAULT NOW(),
      is_pinned INTEGER DEFAULT 0,
      is_dismissed INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("Created targets table");

  await sql`
    CREATE TABLE IF NOT EXISTS signals_history (
      id SERIAL PRIMARY KEY,
      target_id TEXT NOT NULL,
      score INTEGER,
      signal_text TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("Created signals_history table");

  await sql`
    CREATE TABLE IF NOT EXISTS deep_dives (
      id TEXT PRIMARY KEY,
      target_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("Created deep_dives table");

  console.log("Schema creation complete!");
}

createSchema().catch((err) => {
  console.error("Schema creation failed:", err);
  process.exit(1);
});
