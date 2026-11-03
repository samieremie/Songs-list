import supabase from "./songsApi";

// All queries on the `songs` table live here so components never deal with
// table or column names directly. Every helper returns { data, error }.

export function listSongs() {
  return supabase.from("songs").select();
}

export function addSong({ title, musicScale }) {
  return supabase.from("songs").insert([{ title, music_scale: musicScale }]);
}

export function deleteSong(id) {
  return supabase.from("songs").delete().eq("id", id);
}

export function setLastSung(id, date) {
  return supabase.from("songs").update({ last_sung: date }).eq("id", id);
}
