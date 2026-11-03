import SongForm from "../components/SongForm";
import supabase from "../api/songsApi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../css/AddSong.css";

function AddSong() {
  const navigate = useNavigate();
  const [addError, setAddError] = useState(null);

  async function handleAddSong({ title, musicScale }) {
    const { error } = await supabase
      .from("songs")
      .insert([{ title: title, music_scale: musicScale }]);
    if (error) {
      console.error("Error adding song:", error.message);
      setAddError("Cântarea nu a putut fi adăugată. Încearcă din nou.");
    } else {
      navigate("/");
    }
  }

  return (
    <div className="add-song-card">
      <h1 className="addsong-heading">Adaugă o cântare</h1>
      <SongForm onSubmit={handleAddSong} />
      {addError && <p className="error-message">{addError}</p>}
    </div>
  );
}

export default AddSong;
