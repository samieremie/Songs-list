import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SongForm from "../components/SongForm";
import { addSong } from "../api/songs";
import "../css/AddSong.css";

function AddSong() {
  const navigate = useNavigate();
  const location = useLocation();
  const [addError, setAddError] = useState(null);

  async function handleAddSong({ title, musicScale }) {
    const { error } = await addSong({ title, musicScale });
    if (error) {
      console.error("Error adding song:", error.message);
      setAddError("Cântarea nu a putut fi adăugată. Încearcă din nou.");
      return false;
    }
    navigate("/", { state: { added: title } });
    return true;
  }

  return (
    <section className="add-page">
      <h1 className="page-title">Adaugă o cântare</h1>
      <p className="page-lede">Apare imediat în lista tuturor.</p>
      <SongForm onSubmit={handleAddSong} initialTitle={location.state?.title ?? ""} />
      {addError && (
        <p className="error-message add-error" role="alert">
          {addError}
        </p>
      )}
    </section>
  );
}

export default AddSong;
