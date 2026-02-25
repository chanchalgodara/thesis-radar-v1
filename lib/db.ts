import { neon } from "@neondatabase/serverless";

let _neonSql: ReturnType<typeof neon> | null = null;

function getNeonSql() {
  if (_neonSql) return _neonSql;
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  if (!connectionString) {
    throw new Error("DATABASE_URL or POSTGRES_URL is not set");
  }
  _neonSql = neon(connectionString);
  return _neonSql;
}

/** Tagged template that returns { rows } to match the shape expected by server.ts */
export async function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  const neonSql = getNeonSql();
  const rows = await neonSql(strings, ...values);
  return { rows: Array.isArray(rows) ? rows : [rows] };
}

export async function initSchema() {
  let neonSql: ReturnType<typeof neon>;
  try {
    neonSql = getNeonSql();
  } catch {
    console.warn("DATABASE_URL / POSTGRES_URL not set; DB calls will fail. Add Neon Postgres (Vercel Marketplace) and set env.");
    return;
  }
  const run = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const r = await neonSql(strings, ...values);
    return r;
  };
  await run`
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
  await run`
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
  await run`
    CREATE TABLE IF NOT EXISTS signals_history (
      id SERIAL PRIMARY KEY,
      target_id TEXT NOT NULL,
      score INTEGER,
      signal_text TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await run`
    CREATE TABLE IF NOT EXISTS deep_dives (
      id TEXT PRIMARY KEY,
      target_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
