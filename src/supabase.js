import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Leaderboard ────────────────────────────────────────────────────────────
export const submitScore = async (username, score) => {
  const { data, error } = await supabase
    .from('leaderboard')
    .insert([{ username, score }]);
  if (error) throw error;
  return data;
};

export const getLeaderboard = async (limit = 10) => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('username, score, created_at')
    .order('score', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};

// ── Grammar performance ────────────────────────────────────────────────────
export const loadGrammarPerformance = async (username) => {
  const { data, error } = await supabase
    .from('grammar_performance')
    .select('pattern_id, correct, incorrect')
    .eq('username', username);
  if (error) throw error;
  // Return as map: { patternId: { correct, incorrect } }
  const map = {};
  for (const row of (data || [])) {
    map[row.pattern_id] = { correct: row.correct, incorrect: row.incorrect };
  }
  return map;
};

export const updateGrammarPerformance = async (username, patternId, wasCorrect) => {
  // Upsert: increment the correct or incorrect counter
  const { data: existing } = await supabase
    .from('grammar_performance')
    .select('id, correct, incorrect')
    .eq('username', username)
    .eq('pattern_id', patternId)
    .maybeSingle();

  if (existing) {
    const update = wasCorrect
      ? { correct: existing.correct + 1, last_seen: new Date().toISOString() }
      : { incorrect: existing.incorrect + 1, last_seen: new Date().toISOString() };
    await supabase
      .from('grammar_performance')
      .update(update)
      .eq('id', existing.id);
  } else {
    await supabase
      .from('grammar_performance')
      .insert([{
        username,
        pattern_id: patternId,
        correct: wasCorrect ? 1 : 0,
        incorrect: wasCorrect ? 0 : 1,
      }]);
  }
};

export const getGrammarWeakPatterns = async (username) => {
  const { data, error } = await supabase
    .from('grammar_performance')
    .select('pattern_id, correct, incorrect')
    .eq('username', username)
    .order('incorrect', { ascending: false });
  if (error) throw error;
  return data || [];
};
