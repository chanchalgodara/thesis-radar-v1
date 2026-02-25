import type { Plugin, ViteDevServer } from "vite";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function apiPlugin(supabaseUrl: string, supabaseKey: string): Plugin {
  return {
    name: "api-routes",
    configureServer(server: ViteDevServer) {
      let db: SupabaseClient | null = null;

      function getDb(): SupabaseClient {
        if (db) return db;
        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Supabase credentials not provided to apiPlugin");
        }
        db = createClient(supabaseUrl, supabaseKey);
        return db;
      }

      function parseBody(req: import("http").IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
          let data = "";
          req.on("data", (chunk: string) => (data += chunk));
          req.on("end", () => {
            try { resolve(data ? JSON.parse(data) : {}); }
            catch { resolve({}); }
          });
          req.on("error", reject);
        });
      }

      function json(res: import("http").ServerResponse, status: number, data: unknown) {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      }

      console.log("[v0] API plugin: supabaseUrl set:", !!supabaseUrl, "supabaseKey set:", !!supabaseKey);

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/")) return next();

        const method = req.method || "GET";

        try {
          const supabase = getDb();

          // GET /api/theses
          if (url === "/api/theses" && method === "GET") {
            const { data, error } = await supabase.from("theses").select("*").order("updated_at", { ascending: false });
            if (error) throw error;
            return json(res, 200, data || []);
          }

          // POST /api/theses
          if (url === "/api/theses" && method === "POST") {
            const body = await parseBody(req);
            const { id, title, description, size_range, funding_stage, geography, technologies } = body;
            const { error } = await supabase.from("theses").insert({ id, title, description, size_range: size_range ?? null, funding_stage: funding_stage ?? null, geography: geography ?? null, technologies: technologies ?? null, is_active: 1 });
            if (error) throw error;
            return json(res, 201, { id });
          }

          // GET /api/stats
          if (url === "/api/stats" && method === "GET") {
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
            return json(res, 200, { total_theses: totalTheses || 0, total_targets: totalTargets || 0, weekly_signals: weeklySignals || 0, thesesStats });
          }

          // POST /api/targets/bulk
          if (url === "/api/targets/bulk" && method === "POST") {
            const body = await parseBody(req);
            const { thesis_id, targets: targetsList } = body;
            if (!targetsList || !Array.isArray(targetsList)) return json(res, 400, { error: "Invalid targets data" });
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
            return json(res, 201, { success: true });
          }

          // POST /api/targets
          if (url === "/api/targets" && method === "POST") {
            const t = await parseBody(req);
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
            return json(res, 201, { id: t.id });
          }

          // POST /api/deep-dives
          if (url === "/api/deep-dives" && method === "POST") {
            const body = await parseBody(req);
            const { id, target_id, content } = body;
            const contentStr = typeof content === "string" ? content : JSON.stringify(content);
            const { error } = await supabase.from("deep_dives").upsert({ id, target_id, content: contentStr });
            if (error) throw error;
            return json(res, 201, { id });
          }

          // POST /api/signals
          if (url === "/api/signals" && method === "POST") {
            const body = await parseBody(req);
            const { target_id, score, signal_text } = body;
            const { error } = await supabase.from("signals_history").insert({ target_id, score: score ?? null, signal_text: signal_text ?? null });
            if (error) throw error;
            return json(res, 201, { success: true });
          }

          // --- Parameterized routes ---
          const thesisToggle = url.match(/^\/api\/theses\/([^/]+)\/toggle$/);
          if (thesisToggle && method === "PATCH") {
            const { data: thesis } = await supabase.from("theses").select("is_active").eq("id", thesisToggle[1]).single();
            const { error } = await supabase.from("theses").update({ is_active: thesis?.is_active === 1 ? 0 : 1 }).eq("id", thesisToggle[1]);
            if (error) throw error;
            return json(res, 200, { success: true });
          }

          const thesisTargets = url.match(/^\/api\/theses\/([^/]+)\/targets$/);
          if (thesisTargets && method === "GET") {
            const { data, error } = await supabase.from("targets").select("*").eq("thesis_id", thesisTargets[1]).order("signal_score", { ascending: false });
            if (error) throw error;
            return json(res, 200, data || []);
          }

          const thesisById = url.match(/^\/api\/theses\/([^/]+)$/);
          if (thesisById && method === "GET") {
            const { data, error } = await supabase.from("theses").select("*").eq("id", thesisById[1]).single();
            if (error && error.code !== "PGRST116") throw error;
            return json(res, 200, data || null);
          }
          if (thesisById && method === "PUT") {
            const body = await parseBody(req);
            const { title, description, size_range, funding_stage, geography, technologies } = body;
            const { error } = await supabase.from("theses").update({ title, description, size_range: size_range ?? null, funding_stage: funding_stage ?? null, geography: geography ?? null, technologies: technologies ?? null, updated_at: new Date().toISOString() }).eq("id", thesisById[1]);
            if (error) throw error;
            return json(res, 200, { success: true });
          }
          if (thesisById && method === "DELETE") {
            const { error } = await supabase.from("theses").delete().eq("id", thesisById[1]);
            if (error) throw error;
            return json(res, 200, { success: true });
          }

          const targetDeepDive = url.match(/^\/api\/targets\/([^/]+)\/deep-dive$/);
          if (targetDeepDive && method === "GET") {
            const { data, error } = await supabase.from("deep_dives").select("*").eq("target_id", targetDeepDive[1]).limit(1).maybeSingle();
            if (error) throw error;
            return json(res, 200, data || null);
          }

          const targetSignals = url.match(/^\/api\/targets\/([^/]+)\/signals$/);
          if (targetSignals && method === "GET") {
            const { data, error } = await supabase.from("signals_history").select("*").eq("target_id", targetSignals[1]).order("created_at", { ascending: false });
            if (error) throw error;
            return json(res, 200, data || []);
          }

          const targetById = url.match(/^\/api\/targets\/([^/]+)$/);
          if (targetById && method === "PATCH") {
            const body = await parseBody(req);
            const id = targetById[1];
            const updates: Record<string, unknown> = { last_updated: new Date().toISOString() };
            if (body.signal_score !== undefined) updates.signal_score = body.signal_score;
            if (body.top_signal !== undefined) updates.top_signal = body.top_signal;
            if (body.is_pinned !== undefined) updates.is_pinned = body.is_pinned;
            if (body.is_dismissed !== undefined) updates.is_dismissed = body.is_dismissed;
            const { error } = await supabase.from("targets").update(updates).eq("id", id);
            if (error) throw error;
            return json(res, 200, { success: true });
          }
          if (targetById && method === "DELETE") {
            const { error } = await supabase.from("targets").delete().eq("id", targetById[1]);
            if (error) throw error;
            return json(res, 200, { success: true });
          }

          json(res, 404, { error: "API route not found" });
        } catch (e: any) {
          console.error("API error:", e);
          json(res, 500, { error: e.message || "Internal server error" });
        }
      });
    },
  };
}
