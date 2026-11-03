import { useState } from "react";
import "../css/SongForm.css";

function SongForm({ onSubmit }) {
  const [title, setTitle] = useState("");
  const [musicScale, setMusicScale] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    if (!title || !musicScale) {
      return;
    }

    // Call the parent handler
    onSubmit({ title, musicScale });

    // Reset form fields
    setTitle("");
    setMusicScale("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <div className="form">
          <input
            className="title-input"
            type="text"
            placeholder="Titlu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="scale-input"
            type="text"
            placeholder="Gama"
            value={musicScale}
            onChange={(e) => setMusicScale(e.target.value)}
          />
        </div>
        <button className="add-btn" type="submit">
          Adaugă
        </button>
      </div>
    </form>
  );
}

export default SongForm;
