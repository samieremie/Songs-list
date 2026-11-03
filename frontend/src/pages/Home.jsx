import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import SongCard from "../components/SongCard";
import LetterIndex from "../components/LetterIndex";
import ConfirmSheet from "../components/ConfirmSheet";
import { deleteSong, listSongs } from "../api/songs";
import { filterSongs, groupByLetter, plural, sortByTitle } from "../utils/text";
import "../css/Home.css";

// White line-art logo on a transparent background (public/logo.png).
const LOGO_URL = "/logo.png";
const TILE_COLORS = ["sun", "hibiscus", "palm", "spring"];

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function Home() {
  const location = useLocation();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [statusMessage, setStatusMessage] = useState(() =>
    location.state?.added ? `„${location.state.added}” a fost adăugată.` : null
  );
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchSongs = async () => {
      const { data, error } = await listSongs();
      if (cancelled) return;

      if (error) {
        console.error("Error fetching songs:", error.message);
        setErrorMessage("Nu s-au putut încărca cântările. Încearcă din nou.");
        setSongs([]);
      } else {
        setSongs(data ?? []);
        setErrorMessage(null);
      }
      setLoading(false);
    };

    fetchSongs();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(
    () => groupByLetter(sortByTitle(filterSongs(songs, query))),
    [songs, query]
  );

  const cancelDelete = useCallback(() => setPendingDelete(null), []);

  const confirmDelete = async () => {
    const song = pendingDelete;
    setDeleting(true);
    const { error } = await deleteSong(song.id);
    setDeleting(false);
    setPendingDelete(null);

    if (error) {
      console.error("Error deleting song:", error.message);
      setStatusMessage(null);
      setErrorMessage("Cântarea nu a putut fi ștearsă. Încearcă din nou.");
      return;
    }
    setErrorMessage(null);
    setStatusMessage(`„${song.title}” a fost ștearsă.`);
    setSongs((prev) => prev.filter((s) => s.id !== song.id));
  };

  const jumpTo = (letter) => {
    document.getElementById(`litera-${letter}`)?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };

  const placeholder =
    songs.length > 1
      ? `Caută printre ${plural(songs.length, "o cântare", "cântări")}`
      : "Caută o cântare";
  const showIndex = !query && groups.length > 3;

  return (
    <div className={`home${showIndex ? " has-index" : ""}`}>
      <header className="home-header">
        <div className="brand">
          {!logoFailed && (
            <span className="brand-badge">
              <img
                className="brand-logo"
                src={LOGO_URL}
                alt=""
                onError={() => setLogoFailed(true)}
              />
            </span>
          )}
          <div>
            <h1 className="home-title">Cântări tineret</h1>
            <p className="home-church">Elim Bruxelles</p>
          </div>
        </div>
        <SearchBar value={query} onChange={setQuery} placeholder={placeholder} />
      </header>

      <div aria-live="polite">
        {statusMessage && <p className="status-message home-message">{statusMessage}</p>}
        {errorMessage && <p className="error-message home-message">{errorMessage}</p>}
      </div>

      {loading && <p className="home-note">Se încarcă cântările…</p>}

      {!loading && !errorMessage && songs.length === 0 && (
        <div className="home-empty">
          <p>Lista e încă goală.</p>
          <Link to="/addsong" className="btn btn-sun">
            Adaugă prima cântare
          </Link>
        </div>
      )}

      {!loading && songs.length > 0 && groups.length === 0 && (
        <div className="home-empty">
          <p>Nicio cântare pentru „{query.trim()}”.</p>
          <Link to="/addsong" state={{ title: query.trim() }} className="btn btn-sun">
            Adaug-o în listă
          </Link>
        </div>
      )}

      {groups.map(([letter, letterSongs], i) => (
        <section
          key={letter}
          id={`litera-${letter}`}
          className="letter-group"
          aria-labelledby={`litera-${letter}-titlu`}
        >
          <h2
            id={`litera-${letter}-titlu`}
            className={`letter-tile tile-${TILE_COLORS[i % TILE_COLORS.length]}`}
          >
            {letter}
          </h2>
          <ul className="song-list">
            {letterSongs.map((song) => (
              <SongCard key={song.id} song={song} onDelete={setPendingDelete} />
            ))}
          </ul>
        </section>
      ))}

      {showIndex && <LetterIndex letters={groups.map(([l]) => l)} onJump={jumpTo} />}

      {pendingDelete && (
        <ConfirmSheet
          title={`Ștergi „${pendingDelete.title}”?`}
          message="Cântarea dispare din listă pentru toată lumea și nu poate fi recuperată."
          confirmLabel="Șterge cântarea"
          cancelLabel="Renunță"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}

export default Home;
