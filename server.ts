// This file is only used for "npm start" (local production mode).
// In dev mode, Vite runs directly with the vite-api-plugin handling /api routes.
// On Vercel, api/server.ts is the serverless function entry point.

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { sql, initSchema } from "./lib/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

let schemaInited = false;
async function ensureSchema() {
  if (schemaInited) return;
  await initSchema();
  schemaInited = true;
}

app.use(async (_req, _res, next) => {
  await ensureSchema();
  next();
});

// Theses
app.get("/api/theses", async (_req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM theses ORDER BY updated_at DESC`;
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch theses" });
  }
});

app.post("/api/theses", async (req, res) => {
  try {
    const { id, title, description, size_range, funding_stage, geography, technologies } = req.body;
    await sql`
      INSERT INTO theses (id, title, description, size_range, funding_stage, geography, technologies, is_active)
      VALUES (${id}, ${title}, ${description}, ${size_range ?? null}, ${funding_stage ?? null}, ${geography ?? null}, ${technologies ?? null}, 1)
    `;
    res.status(201).json({ id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create thesis" });
  }
});

app.patch("/api/theses/:id/toggle", async (req, res) => {
  try {
    await sql`UPDATE theses SET is_active = 1 - is_active WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to toggle thesis" });
  }
});

app.put("/api/theses/:id", async (req, res) => {
  try {
    const { title, description, size_range, funding_stage, geography, technologies } = req.body;
    await sql`
      UPDATE theses
      SET title = ${title}, description = ${description}, size_range = ${size_range ?? null}, funding_stage = ${funding_stage ?? null}, geography = ${geography ?? null}, technologies = ${technologies ?? null}, updated_at = NOW()
      WHERE id = ${req.params.id}
    `;
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update thesis" });
  }
});

app.delete("/api/theses/:id", async (req, res) => {
  try {
    await sql`DELETE FROM theses WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete thesis" });
  }
});

// Targets
app.get("/api/theses/:thesisId/targets", async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM targets WHERE thesis_id = ${req.params.thesisId} ORDER BY signal_score DESC`;
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch targets" });
  }
});

app.post("/api/targets", async (req, res) => {
  try {
    const t = req.body;
    await sql`
      INSERT INTO targets (
        id, thesis_id, name, one_liner, stage, headcount, signal_score, top_signal, fit_rating,
        client_overlap_current, client_overlap_potential, product_rating, product_score,
        valuation, funding_stage_detail, current_investors
      )
      VALUES (
        ${t.id}, ${t.thesis_id}, ${t.name}, ${t.one_liner ?? null}, ${t.stage ?? null}, ${t.headcount ?? null},
        ${t.signal_score ?? 0}, ${t.top_signal ?? null}, ${t.fit_rating ?? null},
        ${t.client_overlap_current ?? null}, ${t.client_overlap_potential ?? null},
        ${t.product_rating ?? null}, ${t.product_score ?? null},
        ${t.valuation ?? null}, ${t.funding_stage_detail ?? null}, ${t.current_investors ?? null}
      )
    `;
    res.status(201).json({ id: t.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create target" });
  }
});

app.post("/api/targets/bulk", async (req, res) => {
  try {
    const { thesis_id, targets: targetsList } = req.body;
    if (!targetsList || !Array.isArray(targetsList)) {
      return res.status(400).json({ error: "Invalid targets data" });
    }
    for (const t of targetsList) {
      await sql`
        INSERT INTO targets (
          id, thesis_id, name, one_liner, stage, headcount, signal_score, top_signal, fit_rating,
          client_overlap_current, client_overlap_potential, product_rating, product_score,
          valuation, funding_stage_detail, current_investors
        )
        VALUES (
          ${t.id}, ${thesis_id}, ${t.name}, ${t.one_liner ?? null}, ${t.stage ?? null}, ${t.headcount ?? null},
          ${t.signal_score ?? 0}, ${t.top_signal ?? null}, ${t.fit_rating ?? null},
          ${t.client_overlap_current ?? null}, ${t.client_overlap_potential ?? null},
          ${t.product_rating ?? null}, ${t.product_score ?? null},
          ${t.valuation ?? null}, ${t.funding_stage_detail ?? null}, ${t.current_investors ?? null}
        )
      `;
    }
    res.status(201).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to bulk insert targets" });
  }
});

app.patch("/api/targets/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body as Record<string, unknown>;
    if (body.signal_score !== undefined) await sql`UPDATE targets SET signal_score = ${body.signal_score as number}, last_updated = NOW() WHERE id = ${id}`;
    if (body.top_signal !== undefined) await sql`UPDATE targets SET top_signal = ${body.top_signal as string}, last_updated = NOW() WHERE id = ${id}`;
    if (body.is_pinned !== undefined) await sql`UPDATE targets SET is_pinned = ${body.is_pinned as number}, last_updated = NOW() WHERE id = ${id}`;
    if (body.is_dismissed !== undefined) await sql`UPDATE targets SET is_dismissed = ${body.is_dismissed as number}, last_updated = NOW() WHERE id = ${id}`;
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update target" });
  }
});

app.delete("/api/targets/:id", async (req, res) => {
  try {
    await sql`DELETE FROM targets WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete target" });
  }
});

// Deep Dives
app.get("/api/targets/:id/deep-dive", async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM deep_dives WHERE target_id = ${req.params.id}`;
    res.json(rows[0] || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch deep dive" });
  }
});

app.post("/api/deep-dives", async (req, res) => {
  try {
    const { id, target_id, content } = req.body;
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    await sql`
      INSERT INTO deep_dives (id, target_id, content)
      VALUES (${id}, ${target_id}, ${contentStr})
      ON CONFLICT (id) DO UPDATE SET target_id = ${target_id}, content = ${contentStr}
    `;
    res.status(201).json({ id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to save deep dive" });
  }
});

// Signals History
app.get("/api/targets/:id/signals", async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM signals_history WHERE target_id = ${req.params.id} ORDER BY created_at DESC`;
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch signals" });
  }
});

app.post("/api/signals", async (req, res) => {
  try {
    const { target_id, score, signal_text } = req.body;
    await sql`
      INSERT INTO signals_history (target_id, score, signal_text)
      VALUES (${target_id}, ${score ?? null}, ${signal_text ?? null})
    `;
    res.status(201).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create signal" });
  }
});

// Stats
app.get("/api/stats", async (_req, res) => {
  try {
    const { rows: statsRows } = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM theses) as total_theses,
        (SELECT COUNT(*)::int FROM targets) as total_targets,
        (SELECT COUNT(*)::int FROM signals_history WHERE created_at > NOW() - INTERVAL '7 days') as weekly_signals
    `;
    const stats = statsRows[0];
    const { rows: thesesStats } = await sql`
      SELECT
        t.id,
        (SELECT COUNT(*)::int FROM targets WHERE thesis_id = t.id) as targets_count,
        (SELECT COUNT(*)::int FROM signals_history sh JOIN targets tg ON sh.target_id = tg.id WHERE tg.thesis_id = t.id) as signals_count
      FROM theses t
    `;
    res.json({ ...stats, thesesStats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Serve static in production
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

ensureSchema().then(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
});

export default app;
