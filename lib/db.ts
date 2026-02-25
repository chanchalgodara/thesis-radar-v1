import { supabase } from './supabase';

// ---- Theses ----

export async function fetchAllTheses() {
  const { data, error } = await supabase
    .from('theses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchStatsData() {
  const { count: totalTheses } = await supabase
    .from('theses')
    .select('*', { count: 'exact', head: true });

  const { count: activeTheses } = await supabase
    .from('theses')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', 1);

  const { count: totalTargets } = await supabase
    .from('targets')
    .select('*', { count: 'exact', head: true });

  const { count: pinnedTargets } = await supabase
    .from('targets')
    .select('*', { count: 'exact', head: true })
    .eq('is_pinned', 1);

  // Fetch per-thesis target counts for Dashboard cards
  const { data: thesesData } = await supabase.from('theses').select('id');
  const thesesStats = [];
  if (thesesData) {
    for (const t of thesesData) {
      const { count } = await supabase
        .from('targets')
        .select('*', { count: 'exact', head: true })
        .eq('thesis_id', t.id);
      thesesStats.push({ id: t.id, targets_count: count || 0 });
    }
  }

  return {
    total_theses: totalTheses || 0,
    active_theses: activeTheses || 0,
    total_targets: totalTargets || 0,
    pinned_targets: pinnedTargets || 0,
    thesesStats,
  };
}

export async function createThesis(thesis: any) {
  const { error } = await supabase.from('theses').upsert(thesis);
  if (error) throw error;
}

export async function deleteThesis(id: string) {
  const { data: targets } = await supabase
    .from('targets')
    .select('id')
    .eq('thesis_id', id);

  if (targets && targets.length > 0) {
    const targetIds = targets.map((t: any) => t.id);
    await supabase.from('deep_dives').delete().in('target_id', targetIds);
    await supabase.from('signals_history').delete().in('target_id', targetIds);
    await supabase.from('targets').delete().eq('thesis_id', id);
  }

  const { error } = await supabase.from('theses').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleThesisStatus(id: string) {
  const { data } = await supabase.from('theses').select('is_active').eq('id', id).single();
  if (!data) return;
  const { error } = await supabase
    .from('theses')
    .update({ is_active: data.is_active ? 0 : 1 })
    .eq('id', id);
  if (error) throw error;
}

// ---- Targets ----

export async function fetchTargetsByThesis(thesisId: string) {
  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .eq('thesis_id', thesisId)
    .order('signal_score', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function bulkInsertTargets(thesisId: string, targets: any[]) {
  const { data: oldTargets } = await supabase
    .from('targets')
    .select('id')
    .eq('thesis_id', thesisId);

  if (oldTargets && oldTargets.length > 0) {
    const oldIds = oldTargets.map((t: any) => t.id);
    await supabase.from('deep_dives').delete().in('target_id', oldIds);
    await supabase.from('signals_history').delete().in('target_id', oldIds);
    await supabase.from('targets').delete().eq('thesis_id', thesisId);
  }

  if (targets.length > 0) {
    const { error } = await supabase.from('targets').insert(targets);
    if (error) throw error;
  }
}

export async function insertTarget(target: any) {
  const { error } = await supabase.from('targets').insert(target);
  if (error) throw error;
}

export async function updateTarget(id: string, updates: any) {
  const { error } = await supabase
    .from('targets')
    .update({ ...updates, last_updated: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ---- Signals ----

export async function insertSignal(signal: { target_id: string; score: number; signal_text: string }) {
  const { error } = await supabase.from('signals_history').insert(signal);
  if (error) throw error;
}

// ---- Deep Dives ----

export async function getDeepDive(targetId: string) {
  const { data, error } = await supabase
    .from('deep_dives')
    .select('*')
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveDeepDive(dive: { id: string; target_id: string; content: any }) {
  const { error } = await supabase.from('deep_dives').upsert({
    ...dive,
    content: typeof dive.content === 'string' ? dive.content : JSON.stringify(dive.content),
  });
  if (error) throw error;
}
