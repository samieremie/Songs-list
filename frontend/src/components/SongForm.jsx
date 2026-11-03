import { useState } from "react";
import "../css/SongForm.css";

function SongForm({ onSubmit, initialTitle = "" }) {
  const [title, setTitle] = useState(initialTitle);
  const [musicScale, setMusicScale] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanScale = musicScale.trim();

    const nextErrors = {};
    if (!cleanTitle) nextErrors.title = "Scrie titlul cântării.";
    if (!cleanScale) nextErrors.musicScale = "Scrie gama, de exemplu Re major.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const ok = await onSubmit({ title: cleanTitle, musicScale: cleanScale });
    setSubmitting(false);

    if (ok !== false) {
      setTitle("");
      setMusicScale("");
    }
  };

  return (
    <form className="song-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="song-title">Titlu</label>
        <input
          id="song-title"
          type="text"
          autoComplete="off"
          placeholder="ex. Ce bine e"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "song-title-error" : undefined}
        />
        {errors.title && (
          <p id="song-title-error" className="field-error">
            {errors.title}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="song-scale">Gama</label>
        <input
          id="song-scale"
          type="text"
          autoComplete="off"
          placeholder="ex. Re major"
          value={musicScale}
          onChange={(e) => setMusicScale(e.target.value)}
          aria-invalid={Boolean(errors.musicScale)}
          aria-describedby={errors.musicScale ? "song-scale-error" : undefined}
        />
        {errors.musicScale && (
          <p id="song-scale-error" className="field-error">
            {errors.musicScale}
          </p>
        )}
      </div>

      <button type="submit" className="btn btn-sun song-form-submit" disabled={submitting}>
        {submitting ? "Se adaugă…" : "Adaugă cântarea"}
      </button>
    </form>
  );
}

export default SongForm;
