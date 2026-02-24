import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("thesis_radar.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS theses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    size_range TEXT,
    funding_stage TEXT,
    geography TEXT,
    technologies TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_pinned INTEGER DEFAULT 0,
    is_dismissed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_id) REFERENCES theses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS signals_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id TEXT NOT NULL,
    score INTEGER,
    signal_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS deep_dives (
    id TEXT PRIMARY KEY,
    target_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE CASCADE
  );
`);

// Add missing columns if they don't exist
const columns = db.prepare("PRAGMA table_info(targets)").all();
const columnNames = columns.map((c: any) => c.name);

const missingColumns = [
  { name: 'client_overlap_current', type: 'TEXT' },
  { name: 'client_overlap_potential', type: 'TEXT' },
  { name: 'product_rating', type: 'TEXT' },
  { name: 'product_score', type: 'INTEGER' },
  { name: 'valuation', type: 'TEXT' },
  { name: 'funding_stage_detail', type: 'TEXT' },
  { name: 'current_investors', type: 'TEXT' }
];

for (const col of missingColumns) {
  if (!columnNames.includes(col.name)) {
    db.prepare(`ALTER TABLE targets ADD COLUMN ${col.name} ${col.type}`).run();
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Theses
  app.get("/api/theses", (req, res) => {
    const theses = db.prepare("SELECT * FROM theses ORDER BY updated_at DESC").all();
    res.json(theses);
  });

  app.get("/api/theses/:id", (req, res) => {
    const thesis = db.prepare("SELECT * FROM theses WHERE id = ?").get(req.params.id);
    if (!thesis) return res.status(404).json({ error: "Thesis not found" });
    res.json(thesis);
  });

  app.post("/api/theses", (req, res) => {
    const { id, title, description, size_range, funding_stage, geography, technologies } = req.body;
    db.prepare(`
      INSERT INTO theses (id, title, description, size_range, funding_stage, geography, technologies, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id, title, description, size_range, funding_stage, geography, technologies);
    res.status(201).json({ id });
  });

  app.patch("/api/theses/:id/toggle", (req, res) => {
    db.prepare("UPDATE theses SET is_active = 1 - is_active WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.put("/api/theses/:id", (req, res) => {
    const { title, description, size_range, funding_stage, geography, technologies } = req.body;
    db.prepare(`
      UPDATE theses 
      SET title = ?, description = ?, size_range = ?, funding_stage = ?, geography = ?, technologies = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, size_range, funding_stage, geography, technologies, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/theses/:id", (req, res) => {
    db.prepare("DELETE FROM theses WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Targets
  app.get("/api/theses/:thesisId/targets", (req, res) => {
    const targets = db.prepare("SELECT * FROM targets WHERE thesis_id = ? ORDER BY signal_score DESC").all(req.params.thesisId);
    res.json(targets);
  });

  app.post("/api/targets", (req, res) => {
    const { 
      id, thesis_id, name, one_liner, stage, headcount, signal_score, top_signal, fit_rating,
      client_overlap_current, client_overlap_potential, product_rating, product_score,
      valuation, funding_stage_detail, current_investors
    } = req.body;
    db.prepare(`
      INSERT INTO targets (
        id, thesis_id, name, one_liner, stage, headcount, signal_score, top_signal, fit_rating,
        client_overlap_current, client_overlap_potential, product_rating, product_score,
        valuation, funding_stage_detail, current_investors
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, thesis_id, name, one_liner, stage, headcount, signal_score, top_signal, fit_rating,
      client_overlap_current, client_overlap_potential, product_rating, product_score,
      valuation, funding_stage_detail, current_investors
    );
    res.status(201).json({ id });
  });

  app.post("/api/targets/bulk", (req, res) => {
    const { thesis_id, targets } = req.body;
    const insert = db.prepare(`
      INSERT INTO targets (
        id, thesis_id, name, one_liner, stage, headcount, signal_score, top_signal, fit_rating,
        client_overlap_current, client_overlap_potential, product_rating, product_score,
        valuation, funding_stage_detail, current_investors
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = db.transaction((targetsList) => {
      for (const t of targetsList) {
        insert.run(
          t.id, thesis_id, t.name, t.one_liner, t.stage, t.headcount, t.signal_score, t.top_signal, t.fit_rating,
          t.client_overlap_current, t.client_overlap_potential, t.product_rating, t.product_score,
          t.valuation, t.funding_stage_detail, t.current_investors
        );
      }
    });
    
    transaction(targets);
    res.status(201).json({ success: true });
  });

  app.patch("/api/targets/:id", (req, res) => {
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    const setClause = fields.map(f => `${f} = ?`).join(", ");
    db.prepare(`UPDATE targets SET ${setClause}, last_updated = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/targets/:id", (req, res) => {
    db.prepare("DELETE FROM targets WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Deep Dives
  app.get("/api/targets/:id/deep-dive", (req, res) => {
    const dive = db.prepare("SELECT * FROM deep_dives WHERE target_id = ?").get(req.params.id);
    res.json(dive || null);
  });

  app.post("/api/deep-dives", (req, res) => {
    const { id, target_id, content } = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO deep_dives (id, target_id, content)
      VALUES (?, ?, ?)
    `).run(id, target_id, JSON.stringify(content));
    res.status(201).json({ id });
  });

  // Signals History
  app.get("/api/targets/:id/signals", (req, res) => {
    const signals = db.prepare("SELECT * FROM signals_history WHERE target_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json(signals);
  });

  app.post("/api/signals", (req, res) => {
    const { target_id, score, signal_text } = req.body;
    db.prepare(`
      INSERT INTO signals_history (target_id, score, signal_text)
      VALUES (?, ?, ?)
    `).run(target_id, score, signal_text);
    res.status(201).json({ success: true });
  });

  // Summary Stats
  app.get("/api/stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM theses) as total_theses,
        (SELECT COUNT(*) FROM targets) as total_targets,
        (SELECT COUNT(*) FROM signals_history WHERE created_at > date('now', '-7 days')) as weekly_signals
    `).get();

    const thesesStats = db.prepare(`
      SELECT 
        t.id,
        (SELECT COUNT(*) FROM targets WHERE thesis_id = t.id) as targets_count,
        (SELECT COUNT(*) FROM signals_history sh JOIN targets tg ON sh.target_id = tg.id WHERE tg.thesis_id = t.id) as signals_count
      FROM theses t
    `).all();

    res.json({ ...stats, thesesStats });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
