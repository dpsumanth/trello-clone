import { supabase } from '../lib/supabaseClient';

const DEFAULT_LISTS = ['To Do', 'In Progress', 'Done'];

async function ensureProfile(user) {
  if (!user?.id) return;
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || '',
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (error) throw error;
}

export async function getBoards() {
  const { data, error } = await supabase
    .from('boards')
    .select('id, title, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getBoardById(boardId) {
  const { data, error } = await supabase
    .from('boards')
    .select('id, title, user_id, created_at, updated_at')
    .eq('id', boardId)
    .single();

  if (error) throw error;
  return data;
}

export async function createBoard({ title, user }) {
  await ensureProfile(user);

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .insert({
      title: title.trim(),
      user_id: user.id,
    })
    .select('id, title, created_at, updated_at')
    .single();

  if (boardError) throw boardError;

  const defaultListRows = DEFAULT_LISTS.map((listTitle, index) => ({
    board_id: board.id,
    title: listTitle,
    position: index,
  }));

  const { error: listError } = await supabase.from('lists').insert(defaultListRows);
  if (listError) throw listError;

  return board;
}

export async function updateBoard(boardId, { title }) {
  const { data, error } = await supabase
    .from('boards')
    .update({ title: title.trim() })
    .eq('id', boardId)
    .select('id, title, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBoard(boardId) {
  const { error } = await supabase.from('boards').delete().eq('id', boardId);
  if (error) throw error;
}
