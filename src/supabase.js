import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
