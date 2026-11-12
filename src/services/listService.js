import { supabase } from '../lib/supabaseClient';

export async function getListsByBoard(boardId) {
  const { data, error } = await supabase
    .from('lists')
    .select('id, board_id, title, position, created_at')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createList({ boardId, title, position }) {
  const { data, error } = await supabase
    .from('lists')
    .insert({
      board_id: boardId,
      title: title.trim(),
      position,
    })
    .select('id, board_id, title, position, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function updateList(listId, { title }) {
  const { data, error } = await supabase
    .from('lists')
    .update({ title: title.trim() })
    .eq('id', listId)
    .select('id, board_id, title, position, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteList(listId) {
  const { error } = await supabase.from('lists').delete().eq('id', listId);
  if (error) throw error;
}
