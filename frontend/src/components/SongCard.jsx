import "../css/SongCard.css";
import supabase from "../api/songsApi";
import { useState } from "react";

function SongCard({ song, onDelete }) {
  const [expanded, setExpanded] = useState(false); // track if card is expanded
  const [lastSung, setLastSung] = useState(song.last_sung); // track locally
  const [updateError, setUpdateError] = useState(null);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleMarkAsSung = async () => {
    const newDate = lastSung ? null : new Date().toISOString().split("T")[0]; // toggle

    const { error } = await supabase
      .from("songs")
      .update({ last_sung: newDate })
      .eq("id", song.id);

    if (error) {
      console.error("Error updating last_sung:", error.message);
      setUpdateError("Nu s-a putut actualiza cântarea. Încearcă din nou.");
    } else {
      setUpdateError(null);
      setLastSung(newDate); // update local state
      // if (onUpdate) onUpdate(song.id, today); // optional parent callback
    }
  };

  // Check if the song was sung less than a month ago
  const isRecent =
    lastSung &&
    new Date(lastSung) > new Date(new Date() - 30 * 24 * 60 * 60 * 1000);

  return (
    <div className={`song-card ${isRecent ? "recently-sung" : ""}`}>
      {/* Always visible */}
      <div className="song-header" onClick={toggleExpanded}>
        <h3 className="song-title">{song.title}</h3>
        <div
          className="more-info"
          onClick={(e) => {
            e.stopPropagation(); // prevents double-triggering when clicking the button
            toggleExpanded();
          }}
        >
          {expanded ? "Ascunde" : "Mai multe"}
          <span className={`arrow-icon ${expanded ? "open" : ""}`}>
            <span className="left-bar"></span>
            <span className="right-bar"></span>
          </span>
        </div>
      </div>

      {/* Conditionally rendered */}

      <div className={`song-details ${expanded ? "show" : ""}`}>
        <p className="music-scale">
          <strong>Gama:</strong> {song.music_scale}
        </p>
        <div className="buttons">
          <button className="delete-btn" onClick={() => onDelete(song.id)}>
            Șterge
          </button>
          <div className="right-btns">
            {/* <button className="update-btn">Modifică</button> */}
            <button className="mark-as-sung-btn" onClick={handleMarkAsSung}>
              Cântat
            </button>
          </div>
        </div>
        {updateError && <p className="error-message">{updateError}</p>}
      </div>
    </div>
  );
}

export default SongCard;
