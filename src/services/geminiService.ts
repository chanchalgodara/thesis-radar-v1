import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export interface Thesis {
  id: string;
  title: string;
  description: string;
  size_range?: string;
  funding_stage?: string;
  geography?: string;
  technologies?: string;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Target {
  id: string;
  thesis_id: string;
  name: string;
  one_liner: string;
  stage: string;
  headcount: string;
  signal_score: number;
  top_signal: string;
  fit_rating: 'Strong' | 'Moderate' | 'Weak';
  last_updated: string;
  is_pinned: number;
  is_dismissed: number;
  // New columns
  client_overlap_current?: string;
  client_overlap_potential?: string;
  product_rating?: string;
  product_score?: number;
  valuation?: string;
  funding_stage_detail?: string;
  current_investors?: string;
}

export interface Competitor {
  rank: number;
  name: string;
  details: string;
  description: string;
  funding: string;
  investors: string;
}

export interface DeepDive {
  overview: string[];
  strategic_fit: string[];
  team: string[];
  product_tech: string[];
  financials: string[];
  timing: string[];
  risks: string[];
  comparables: string[];
  sources: string;
  // New sections
  funding_investors: string[];
  founders: string[];
  competitors: Competitor[];
  cap_table_shareholding: string[];
  investments_acquisitions: string[];
  product_alignment_signals: string[];
}

const getAI = (apiKey: string) => {
  return new GoogleGenAI({ apiKey });
};

export interface WorkflowStep {
  id: string;
  title: string;
  logic: string;
  tasks: string[];
}

export interface CalibrationData {
  market_context: string;
  parameters: {
    size_range: string;
    funding_stage: string;
    geography: string;
    technologies: string;
  };
  signals: string[];
  workflow: WorkflowStep[];
  vercel_relevance_score: number; // 0-100
}

export interface SuggestedThesis {
  title: string;
  description: string;
  relevance_score: number;
  rationale: string;
}

export const suggestTheses = async (apiKey: string, strategicConstraints: string = ''): Promise<SuggestedThesis[]> => {
  const ai = getAI(apiKey);
  const prompt = `You are a world-class M&A strategist for Vercel. 
Analyze Vercel's core strategic priorities:
1. Frontend Cloud dominance (DX, performance, reliability).
2. Next.js ecosystem expansion.
3. AI SDK and AI-native developer workflows.
4. Edge Computing and globally distributed infrastructure.
5. Enterprise-grade security and compliance for large-scale deployments.

User Strategic Constraints:
${strategicConstraints || "Focus on high-growth areas complementary to Vercel's current stack."}

Suggest 5 high-impact strategic acquisition theses that Vercel should consider. 
CRITICAL: These should be stable, high-level strategic directions, not transient trends. 
The relevance scores should reflect long-term strategic value to Vercel's mission to "make the web faster".

For each thesis, provide:
1. Title: A concise, professional name for the thesis.
2. Description: A 2-3 sentence strategic rationale.
3. Relevance Score: 0-100 (how critical this is for Vercel's growth).
4. Rationale: Why this makes sense specifically for Vercel's ecosystem.

Return this as structured JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            relevance_score: { type: Type.NUMBER },
            rationale: { type: Type.STRING },
          },
          required: ["title", "description", "relevance_score", "rationale"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
};

export const interpretThesis = async (apiKey: string, thesis: Thesis): Promise<CalibrationData> => {
  const ai = getAI(apiKey);
  const prompt = `You are a senior M&A analyst for Vercel's CorpBD team. 
A user has provided a strategic acquisition thesis: "${thesis.title}: ${thesis.description}"

Analyze this thesis. 
CRITICAL: Evaluate relevance to Vercel's ecosystem (Frontend Cloud, Next.js, Edge Computing, DX, AI SDK). 
If there is NO direct relevance, be honest. Do not force a connection. Instead, explain why it's outside Vercel's core but suggest what the focus should be if an acquisition were still considered.

Provide:
1. Market Context: A deep dive into the industry landscape. If relevant to Vercel, explain why. If not, explain the disconnect but provide a professional segment analysis.
2. Parameters: Inferred target size range, funding stage, geography, and must-have technologies.
3. Evaluation Signals: A list of 6 specific signals aligned with the "6Ps" framework:
   - People (Team quality, departures, hires)
   - Proposition (Market fit, unique value)
   - Product (Tech quality, community traction)
   - Profit pool (Revenue potential, margins)
   - Pricing (Monetization strategy, competitive pricing)
   - Performance (Growth metrics, stability)
   
   CRITICAL: Format each signal as "Category: Concise Description" (e.g., "People: Founders with strong tech background"). 
   The category MUST be one of the 6Ps.
4. Workflow: A structured 3-step agentic workflow.
   Each step must have:
   - title: e.g., "Data Sourcing & Intelligence"
   - logic: A short paragraph explaining the strategic reasoning for this step.
   - tasks: A list of 3-4 specific sub-tasks (e.g., "Fetch latest startups from Pitchbook", "Analyze GitHub activity"). ONLY include tasks that the agent will actually perform.
5. Vercel Relevance Score: A number from 0-100.

Return this as structured JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          market_context: { type: Type.STRING },
          parameters: {
            type: Type.OBJECT,
            properties: {
              size_range: { type: Type.STRING },
              funding_stage: { type: Type.STRING },
              geography: { type: Type.STRING },
              technologies: { type: Type.STRING },
            },
            required: ["size_range", "funding_stage", "geography", "technologies"],
          },
          signals: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          workflow: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                logic: { type: Type.STRING },
                tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["id", "title", "logic", "tasks"],
            },
          },
          vercel_relevance_score: { type: Type.NUMBER },
        },
        required: ["market_context", "parameters", "signals", "workflow", "vercel_relevance_score"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export interface MarketMap {
  categories: {
    name: string;
    description: string;
    companies: {
      name: string;
      rationale: string;
    }[];
  }[];
}

export const generateMarketMap = async (apiKey: string, thesis: Thesis, targets: Partial<Target>[]): Promise<MarketMap> => {
  const ai = getAI(apiKey);
  const prompt = `You are a senior M&A strategist. Generate a comprehensive market map for the following strategic thesis:
"${thesis.title}: ${thesis.description}"

CRITICAL: You MUST include the following identified startups in the appropriate categories:
${targets.map(t => `- ${t.name}`).join('\n')}

Organize the market into 4-6 logical categories. For each category, identify 4-5 key players (real companies). 
Focus on COMPANY NAMES. Provide a very brief (max 10 words) rationale for their inclusion.
One category MUST be "Strategic Startups" and should include high-potential early-stage companies from the list provided.

Return this as structured JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          categories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                companies: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      rationale: { type: Type.STRING },
                    },
                    required: ["name", "rationale"],
                  },
                },
              },
              required: ["name", "description", "companies"],
            },
          },
        },
        required: ["categories"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const executeSearch = async (apiKey: string, calibration: CalibrationData): Promise<Partial<Target>[]> => {
  const ai = getAI(apiKey);
  const prompt = `You are a senior M&A analyst. Based on the following calibrated strategy, identify 15-25 real companies that match.

Strategic Alignment: ${calibration.market_context}
Vercel Relevance Context: ${calibration.vercel_relevance_score > 30 ? "High priority on Vercel synergy." : "General segment search, Vercel synergy is secondary."}

Parameters:
- Size: ${calibration.parameters.size_range}
- Stage: ${calibration.parameters.funding_stage}
- Geography: ${calibration.parameters.geography}
- Tech: ${calibration.parameters.technologies}

Evaluation Signals to prioritize:
${calibration.signals.map(s => `- ${s}`).join('\n')}

Agent Workflow to follow:
${calibration.workflow.map(s => `Step: ${s.title}\nLogic: ${s.logic}\nTasks:\n${s.tasks.map(t => `- ${t}`).join('\n')}`).join('\n\n')}

For each company, provide:
1. Name
2. One-liner (max 15 words)
3. Funding stage
4. Estimated headcount
5. Fit rating (Strong, Moderate, Weak)
6. Signal score (0-100)
7. Top signal: A short, punchy sentence.
8. Current client list overlap: Estimate overlap with Vercel's customer base.
9. Potential client overlap: Estimate future overlap.
10. Product rating: A descriptive rating (e.g., "Best-in-class", "Emerging").
11. Product score: 0-100.
12. Valuation: Estimated current valuation.
13. Funding stage detail: Specific last round info.
14. Current investors: Notable VC/Angel names.

Return the list in DESCENDING order of relevance.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            one_liner: { type: Type.STRING },
            stage: { type: Type.STRING },
            headcount: { type: Type.STRING },
            fit_rating: { type: Type.STRING, enum: ["Strong", "Moderate", "Weak"] },
            signal_score: { type: Type.NUMBER },
            top_signal: { type: Type.STRING },
            client_overlap_current: { type: Type.STRING },
            client_overlap_potential: { type: Type.STRING },
            product_rating: { type: Type.STRING },
            product_score: { type: Type.NUMBER },
            valuation: { type: Type.STRING },
            funding_stage_detail: { type: Type.STRING },
            current_investors: { type: Type.STRING },
          },
          required: ["name", "one_liner", "stage", "headcount", "fit_rating", "signal_score", "top_signal"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
};

export const generateTargets = async (apiKey: string, thesis: Thesis): Promise<Partial<Target>[]> => {
  const ai = getAI(apiKey);
  const prompt = `You are a senior M&A analyst and corporate development strategist. 
Your task is to identify 15-25 real companies that match the following strategic acquisition thesis:

"${thesis.title}: ${thesis.description}"

Additional constraints:
- Size: ${thesis.size_range || 'Any'}
- Stage: ${thesis.funding_stage || 'Any'}
- Geography: ${thesis.geography || 'Any'}
- Tech: ${thesis.technologies || 'Any'}

For each company, provide:
1. Name
2. One-liner (max 15 words)
3. Funding stage
4. Estimated headcount
5. Fit rating (Strong, Moderate, Weak)
6. Signal score (0-100) indicating urgency/readiness for acquisition
7. Top signal: A short, punchy sentence. 
   CRITICAL: If the fit is "Moderate", explicitly state the gap (e.g., "Strong tech but lacks enterprise scale" or "Great synergy but high valuation risk").
8. Current client list overlap: Estimate overlap with Vercel's customer base.
9. Potential client overlap: Estimate future overlap.
10. Product rating: A descriptive rating (e.g., "Best-in-class", "Emerging").
11. Product score: 0-100.
12. Valuation: Estimated current valuation.
13. Funding stage detail: Specific last round info.
14. Current investors: Notable VC/Angel names.

Be practical, opinionated, and focused on actionable targets.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            one_liner: { type: Type.STRING },
            stage: { type: Type.STRING },
            headcount: { type: Type.STRING },
            fit_rating: { type: Type.STRING, enum: ["Strong", "Moderate", "Weak"] },
            signal_score: { type: Type.NUMBER },
            top_signal: { type: Type.STRING },
            client_overlap_current: { type: Type.STRING },
            client_overlap_potential: { type: Type.STRING },
            product_rating: { type: Type.STRING },
            product_score: { type: Type.NUMBER },
            valuation: { type: Type.STRING },
            funding_stage_detail: { type: Type.STRING },
            current_investors: { type: Type.STRING },
          },
          required: ["name", "one_liner", "stage", "headcount", "fit_rating", "signal_score", "top_signal"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
};

export const refreshSignals = async (apiKey: string, thesis: Thesis, targets: Target[]): Promise<{id: string, signal_score: number, top_signal: string}[]> => {
  const ai = getAI(apiKey);
  const prompt = `You are monitoring these companies for a CorpBD team. 
Thesis: "${thesis.title}: ${thesis.description}"

Companies to evaluate:
${targets.map(t => `- ${t.name} (Current Score: ${t.signal_score}, Last Signal: ${t.top_signal})`).join('\n')}

For each company, generate an updated signal score (0-100) and identify any new timing signals. 
Timing signals include: executive departures, layoffs, failed fundraises, competitor acquisitions, product pivots, declining community engagement, or positive counter-signals like large funding rounds.
Be honest about uncertainty.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            signal_score: { type: Type.NUMBER },
            top_signal: { type: Type.STRING },
          },
          required: ["name", "signal_score", "top_signal"],
        },
      },
    },
  });

  const updates = JSON.parse(response.text || "[]");
  return updates.map((u: any) => {
    const target = targets.find(t => t.name.toLowerCase() === u.name.toLowerCase());
    return {
      id: target?.id || '',
      signal_score: u.signal_score,
      top_signal: u.top_signal
    };
  }).filter((u: any) => u.id !== '');
};

export const generateDeepDive = async (apiKey: string, thesis: Thesis, target: Target): Promise<DeepDive> => {
  const ai = getAI(apiKey);
  const context = `M&A deep dive for ${target.name}. Thesis: "${thesis.title}: ${thesis.description}". CRITICAL: NO PARAGRAPHS. Every section must be concise bullet points. Be a senior M&A analyst. Be pragmatic and opinionated.`;

  const callA = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: `${context}

Sections:
1. Overview: 2-3 bullets on what they do, founding year, location, key product.
2. Strategic Fit: 4-6 focused bullets on why this acquisition makes sense.
3. Team: 2-3 bullets on key people (founders, CTO, notable engineers).
4. Product & Technology: 3-5 bullets on what they've built, tech stack, open source presence.
5. Timing Assessment: 2-3 bullets on market maturity and why now is the right time.
6. Risks: 3-4 bullets on integration complexity, team retention, tech overlap.
7. Product Alignment Signals: Specific signals indicating how their product aligns with Vercel's roadmap.
8. Founders: Bullets on founder backgrounds and current roles. Format: "Name (Role/Background, ex-Company)".` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.ARRAY, items: { type: Type.STRING } },
          strategic_fit: { type: Type.ARRAY, items: { type: Type.STRING } },
          team: { type: Type.ARRAY, items: { type: Type.STRING } },
          product_tech: { type: Type.ARRAY, items: { type: Type.STRING } },
          timing: { type: Type.ARRAY, items: { type: Type.STRING } },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          product_alignment_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
          founders: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["overview", "strategic_fit", "team", "product_tech", "timing", "risks", "product_alignment_signals", "founders"],
      },
    },
  });

  const callB = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: `${context}

Sections:
1. Financials (Estimated): 2-3 bullets on revenue range, last known funding, estimated burn.
2. Comparable Transactions: 2-3 bullets on recent acquisitions in this space.
3. Funding and Investors: Bullets on total funding, last round, and key investors.
4. Competitors: A list of 5 direct and indirect competitors with details for a table.
5. Latest Cap Table and Shareholding: Estimated breakdown of ownership.
6. Investments and Acquisitions: Any companies they have acquired or invested in.
7. Tech Stack: Detailed bullets on their infrastructure, languages, and tools.
8. Sources: A list of 3-5 real or highly probable source URLs.` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          financials: { type: Type.ARRAY, items: { type: Type.STRING } },
          comparables: { type: Type.ARRAY, items: { type: Type.STRING } },
          funding_investors: { type: Type.ARRAY, items: { type: Type.STRING } },
          competitors: { 
            type: Type.ARRAY, 
            items: {
              type: Type.OBJECT,
              properties: {
                rank: { type: Type.NUMBER },
                name: { type: Type.STRING },
                details: { type: Type.STRING },
                description: { type: Type.STRING },
                funding: { type: Type.STRING },
                investors: { type: Type.STRING },
              },
              required: ["rank", "name", "details", "description", "funding", "investors"],
            }
          },
          cap_table_shareholding: { type: Type.ARRAY, items: { type: Type.STRING } },
          investments_acquisitions: { type: Type.ARRAY, items: { type: Type.STRING } },
          sources: { type: Type.STRING },
        },
        required: ["financials", "comparables", "funding_investors", "competitors", "cap_table_shareholding", "investments_acquisitions", "sources"],
      },
    },
  });

  const [resA, resB] = await Promise.all([callA, callB]);
  const partA = JSON.parse(resA.text || "{}");
  const partB = JSON.parse(resB.text || "{}");

  return { ...partA, ...partB };
};
