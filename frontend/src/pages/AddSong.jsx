import SongForm from "../components/SongForm";
import supabase from "../api/songsApi";
import { useNavigate } from "react-router-dom";
import "../css/AddSong.css";

function AddSong() {
  const navigate = useNavigate();

  async function handleAddSong({ title, musicScale }) {
    const { data, error } = await supabase
      .from("songs")
      .insert([{ title: title, music_scale: musicScale }]);
    if (!error) {
      navigate("/");
    }
  }

  return (
    <div className="add-song-card">
      <h1 className="addsong-heading">Adauga o cantare</h1>
      <SongForm onSubmit={handleAddSong} />
    </div>
  );
}

export default AddSong;
