import type { Plugin, ViteDevServer } from "vite";
import { sql, initSchema } from "./db";

let schemaInited = false;
async function ensureSchema() {
  if (schemaInited) return;
  await initSchema();
  schemaInited = true;
}

function parseBody(req: import("http").IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: string) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: import("http").ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

export function apiPlugin(): Plugin {
  return {
    name: "api-routes",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/")) return next();

        try {
          await ensureSchema();
        } catch (e) {
          console.error("Schema init error:", e);
          sendJson(res, 500, { error: "DB init failed" });
          return;
        }

        const method = req.method || "GET";

        try {
          // --- Theses ---
          if (url === "/api/theses" && method === "GET") {
            const { rows } = await sql`SELECT * FROM theses ORDER BY updated_at DESC`;
            return sendJson(res, 200, rows);
          }

          if (url === "/api/theses" && method === "POST") {
            const body = await parseBody(req);
            const { id, title, description, size_range, funding_stage, geography, technologies } = body;
            await sql`
              INSERT INTO theses (id, title, description, size_range, funding_stage, geography, technologies, is_active)
              VALUES (${id}, ${title}, ${description}, ${size_range ?? null}, ${funding_stage ?? null}, ${geography ?? null}, ${technologies ?? null}, 1)
            `;
            return sendJson(res, 201, { id });
          }

          if (url === "/api/stats" && method === "GET") {
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
            return sendJson(res, 200, { ...stats, thesesStats });
          }

          if (url === "/api/targets/bulk" && method === "POST") {
            const body = await parseBody(req);
            const { thesis_id, targets: targetsList } = body;
            if (!targetsList || !Array.isArray(targetsList)) {
              return sendJson(res, 400, { error: "Invalid targets data" });
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
            return sendJson(res, 201, { success: true });
          }

          if (url === "/api/targets" && method === "POST") {
            const t = await parseBody(req);
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
            return sendJson(res, 201, { id: t.id });
          }

          if (url === "/api/deep-dives" && method === "POST") {
            const body = await parseBody(req);
            const { id, target_id, content } = body;
            const contentStr = typeof content === "string" ? content : JSON.stringify(content);
            await sql`
              INSERT INTO deep_dives (id, target_id, content)
              VALUES (${id}, ${target_id}, ${contentStr})
              ON CONFLICT (id) DO UPDATE SET target_id = ${target_id}, content = ${contentStr}
            `;
            return sendJson(res, 201, { id });
          }

          if (url === "/api/signals" && method === "POST") {
            const body = await parseBody(req);
            const { target_id, score, signal_text } = body;
            await sql`
              INSERT INTO signals_history (target_id, score, signal_text)
              VALUES (${target_id}, ${score ?? null}, ${signal_text ?? null})
            `;
            return sendJson(res, 201, { success: true });
          }

          // --- Parameterized routes ---
          const thesisToggle = url.match(/^\/api\/theses\/([^/]+)\/toggle$/);
          if (thesisToggle && method === "PATCH") {
            await sql`UPDATE theses SET is_active = 1 - is_active WHERE id = ${thesisToggle[1]}`;
            return sendJson(res, 200, { success: true });
          }

          const thesisTargets = url.match(/^\/api\/theses\/([^/]+)\/targets$/);
          if (thesisTargets && method === "GET") {
            const { rows } = await sql`SELECT * FROM targets WHERE thesis_id = ${thesisTargets[1]} ORDER BY signal_score DESC`;
            return sendJson(res, 200, rows);
          }

          const thesisById = url.match(/^\/api\/theses\/([^/]+)$/);
          if (thesisById && method === "GET") {
            const { rows } = await sql`SELECT * FROM theses WHERE id = ${thesisById[1]}`;
            return sendJson(res, 200, rows[0] || null);
          }
          if (thesisById && method === "PUT") {
            const body = await parseBody(req);
            const { title, description, size_range, funding_stage, geography, technologies } = body;
            await sql`
              UPDATE theses
              SET title = ${title}, description = ${description}, size_range = ${size_range ?? null}, funding_stage = ${funding_stage ?? null}, geography = ${geography ?? null}, technologies = ${technologies ?? null}, updated_at = NOW()
              WHERE id = ${thesisById[1]}
            `;
            return sendJson(res, 200, { success: true });
          }
          if (thesisById && method === "DELETE") {
            await sql`DELETE FROM theses WHERE id = ${thesisById[1]}`;
            return sendJson(res, 200, { success: true });
          }

          const targetDeepDive = url.match(/^\/api\/targets\/([^/]+)\/deep-dive$/);
          if (targetDeepDive && method === "GET") {
            const { rows } = await sql`SELECT * FROM deep_dives WHERE target_id = ${targetDeepDive[1]}`;
            return sendJson(res, 200, rows[0] || null);
          }

          const targetSignals = url.match(/^\/api\/targets\/([^/]+)\/signals$/);
          if (targetSignals && method === "GET") {
            const { rows } = await sql`SELECT * FROM signals_history WHERE target_id = ${targetSignals[1]} ORDER BY created_at DESC`;
            return sendJson(res, 200, rows);
          }

          const targetById = url.match(/^\/api\/targets\/([^/]+)$/);
          if (targetById && method === "PATCH") {
            const body = await parseBody(req);
            const id = targetById[1];
            if (body.signal_score !== undefined) await sql`UPDATE targets SET signal_score = ${body.signal_score}, last_updated = NOW() WHERE id = ${id}`;
            if (body.top_signal !== undefined) await sql`UPDATE targets SET top_signal = ${body.top_signal}, last_updated = NOW() WHERE id = ${id}`;
            if (body.is_pinned !== undefined) await sql`UPDATE targets SET is_pinned = ${body.is_pinned}, last_updated = NOW() WHERE id = ${id}`;
            if (body.is_dismissed !== undefined) await sql`UPDATE targets SET is_dismissed = ${body.is_dismissed}, last_updated = NOW() WHERE id = ${id}`;
            return sendJson(res, 200, { success: true });
          }
          if (targetById && method === "DELETE") {
            await sql`DELETE FROM targets WHERE id = ${targetById[1]}`;
            return sendJson(res, 200, { success: true });
          }

          // Not matched
          sendJson(res, 404, { error: "API route not found" });
        } catch (e) {
          console.error("API error:", e);
          sendJson(res, 500, { error: "Internal server error" });
        }
      });
    },
  };
}
