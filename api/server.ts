import express from "express";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) throw new Error("Supabase credentials not configured");
  return createClient(url, key);
}

const app = express();
app.use(express.json());

// Theses
app.get("/api/theses", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("theses").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.post("/api/theses", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id, title, description, size_range, funding_stage, geography, technologies } = req.body;
    const { error } = await supabase.from("theses").insert({ id, title, description, size_range: size_range ?? null, funding_stage: funding_stage ?? null, geography: geography ?? null, technologies: technologies ?? null, is_active: 1 });
    if (error) throw error;
    res.status(201).json({ id });
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.patch("/api/theses/:id/toggle", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: thesis } = await supabase.from("theses").select("is_active").eq("id", req.params.id).single();
    const { error } = await supabase.from("theses").update({ is_active: thesis?.is_active === 1 ? 0 : 1 }).eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.put("/api/theses/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { title, description, size_range, funding_stage, geography, technologies } = req.body;
    const { error } = await supabase.from("theses").update({ title, description, size_range: size_range ?? null, funding_stage: funding_stage ?? null, geography: geography ?? null, technologies: technologies ?? null, updated_at: new Date().toISOString() }).eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.delete("/api/theses/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("theses").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Targets
app.get("/api/theses/:thesisId/targets", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("targets").select("*").eq("thesis_id", req.params.thesisId).order("signal_score", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.post("/api/targets", async (req, res) => {
  try {
    const supabase = getSupabase();
    const t = req.body;
    const { error } = await supabase.from("targets").insert({
      id: t.id, thesis_id: t.thesis_id, name: t.name, one_liner: t.one_liner ?? null,
      stage: t.stage ?? null, headcount: t.headcount ?? null, signal_score: t.signal_score ?? 0,
      top_signal: t.top_signal ?? null, fit_rating: t.fit_rating ?? null,
      client_overlap_current: t.client_overlap_current ?? null, client_overlap_potential: t.client_overlap_potential ?? null,
      product_rating: t.product_rating ?? null, product_score: t.product_score ?? null,
      valuation: t.valuation ?? null, funding_stage_detail: t.funding_stage_detail ?? null,
      current_investors: t.current_investors ?? null,
    });
    if (error) throw error;
    res.status(201).json({ id: t.id });
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.post("/api/targets/bulk", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { thesis_id, targets: targetsList } = req.body;
    if (!targetsList || !Array.isArray(targetsList)) return res.status(400).json({ error: "Invalid targets data" });
    const rows = targetsList.map((t: any) => ({
      id: t.id, thesis_id, name: t.name, one_liner: t.one_liner ?? null, stage: t.stage ?? null,
      headcount: t.headcount ?? null, signal_score: t.signal_score ?? 0, top_signal: t.top_signal ?? null,
      fit_rating: t.fit_rating ?? null, client_overlap_current: t.client_overlap_current ?? null,
      client_overlap_potential: t.client_overlap_potential ?? null, product_rating: t.product_rating ?? null,
      product_score: t.product_score ?? null, valuation: t.valuation ?? null,
      funding_stage_detail: t.funding_stage_detail ?? null, current_investors: t.current_investors ?? null,
    }));
    const { error } = await supabase.from("targets").insert(rows);
    if (error) throw error;
    res.status(201).json({ success: true });
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.patch("/api/targets/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const id = req.params.id;
    const body = req.body;
    const updates: Record<string, unknown> = { last_updated: new Date().toISOString() };
    if (body.signal_score !== undefined) updates.signal_score = body.signal_score;
    if (body.top_signal !== undefined) updates.top_signal = body.top_signal;
    if (body.is_pinned !== undefined) updates.is_pinned = body.is_pinned;
    if (body.is_dismissed !== undefined) updates.is_dismissed = body.is_dismissed;
    const { error } = await supabase.from("targets").update(updates).eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.delete("/api/targets/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("targets").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Deep Dives
app.get("/api/targets/:id/deep-dive", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("deep_dives").select("*").eq("target_id", req.params.id).limit(1).maybeSingle();
    if (error) throw error;
    res.json(data || null);
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.post("/api/deep-dives", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id, target_id, content } = req.body;
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const { error } = await supabase.from("deep_dives").upsert({ id, target_id, content: contentStr });
    if (error) throw error;
    res.status(201).json({ id });
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Signals History
app.get("/api/targets/:id/signals", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("signals_history").select("*").eq("target_id", req.params.id).order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.post("/api/signals", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { target_id, score, signal_text } = req.body;
    const { error } = await supabase.from("signals_history").insert({ target_id, score: score ?? null, signal_text: signal_text ?? null });
    if (error) throw error;
    res.status(201).json({ success: true });
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Stats
app.get("/api/stats", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { count: totalTheses } = await supabase.from("theses").select("*", { count: "exact", head: true });
    const { count: totalTargets } = await supabase.from("targets").select("*", { count: "exact", head: true });
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: weeklySignals } = await supabase.from("signals_history").select("*", { count: "exact", head: true }).gte("created_at", weekAgo);

    const { data: allTheses } = await supabase.from("theses").select("id");
    const thesesStats = [];
    for (const t of allTheses || []) {
      const { count: tc } = await supabase.from("targets").select("*", { count: "exact", head: true }).eq("thesis_id", t.id);
      const { data: tids } = await supabase.from("targets").select("id").eq("thesis_id", t.id);
      let sc = 0;
      if (tids && tids.length > 0) {
        const { count } = await supabase.from("signals_history").select("*", { count: "exact", head: true }).in("target_id", tids.map((x: any) => x.id));
        sc = count || 0;
      }
      thesesStats.push({ id: t.id, targets_count: tc || 0, signals_count: sc });
    }

    res.json({ total_theses: totalTheses || 0, total_targets: totalTargets || 0, weekly_signals: weeklySignals || 0, thesesStats });
  } catch (e: any) { console.error(e); res.status(500).json({ error: e.message }); }
});

export default app;
