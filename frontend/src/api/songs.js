import supabase from "./songsApi";

// All queries on the `songs` table live here so components never deal with
// table or column names directly. Every helper returns { data, error }.

export function listSongs() {
  return supabase.from("songs").select();
}

// Adding, editing and deleting go through database functions that check the
// shared editor code (see supabase/editor-code.sql).
export function addSong({ title, musicScale, code }) {
  return supabase.rpc("add_song", { p_title: title, p_music_scale: musicScale, p_code: code });
}

export function updateSong({ id, title, musicScale, code }) {
  return supabase.rpc("update_song", {
    p_id: id,
    p_title: title,
    p_music_scale: musicScale,
    p_code: code,
  });
}

export function deleteSong(id, code) {
  return supabase.rpc("delete_song", { p_id: id, p_code: code });
}

// Resolves to { data: true } if the code is right, { data: false } if not.
export function checkEditorCode(code) {
  return supabase.rpc("check_editor_code", { p_code: code });
}

// True when Supabase refused the call because the editor code is wrong
// (for example after the leaders changed it).
export function isInvalidCodeError(error) {
  return error?.code === "28000";
}
