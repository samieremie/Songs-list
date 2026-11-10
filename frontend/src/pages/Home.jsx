import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import SongCard from "../components/SongCard";
import LetterIndex from "../components/LetterIndex";
import ConfirmSheet from "../components/ConfirmSheet";
import SetlistPickerSheet from "../components/SetlistPickerSheet";
import EditorCodeSheet from "../components/EditorCodeSheet";
import { deleteSong, isInvalidCodeError, listSongs } from "../api/songs";
import { addSongToSetlist, listUpcomingSetlists, removeSongFromSetlist } from "../api/setlists";
import { todayISO } from "../utils/dates";
import { clearEditorCode, getEditorCode } from "../utils/editorCode";
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
  // Deleting needs the shared editor code; asked once, then remembered.
  const [editorCode, setEditorCode] = useState(getEditorCode);
  const [codeRequestSong, setCodeRequestSong] = useState(null);
  const [logoFailed, setLogoFailed] = useState(false);
  // Upcoming sub-lists: [{ id, date, setlist_songs: [{ song_id, position }] }]
  const [setlists, setSetlists] = useState([]);
  const [setlistsError, setSetlistsError] = useState(null);
  const [pickerSong, setPickerSong] = useState(null);
  // Only one song row shows its actions at a time.
  const [openSongId, setOpenSongId] = useState(null);
  const toggleSong = (id) => setOpenSongId((current) => (current === id ? null : id));

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

    const fetchSetlists = async () => {
      const { data, error } = await listUpcomingSetlists(todayISO());
      if (cancelled) return;
      if (error) {
        console.error("Error fetching setlists:", error.message);
        setSetlistsError("Sub-listele nu s-au putut încărca. Încearcă din nou.");
      } else {
        setSetlists(data ?? []);
      }
    };

    fetchSongs();
    fetchSetlists();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(
    () => groupByLetter(sortByTitle(filterSongs(songs, query))),
    [songs, query]
  );

  // song id -> dates of the upcoming sub-lists it is in
  const plannedDates = useMemo(() => {
    const map = new Map();
    for (const setlist of setlists) {
      for (const row of setlist.setlist_songs ?? []) {
        map.set(row.song_id, [...(map.get(row.song_id) ?? []), setlist.date]);
      }
    }
    return map;
  }, [setlists]);

  const cancelDelete = useCallback(() => setPendingDelete(null), []);
  const cancelCodeRequest = useCallback(() => setCodeRequestSong(null), []);

  const requestDelete = (song) => {
    if (editorCode) setPendingDelete(song);
    else setCodeRequestSong(song);
  };

  const acceptCode = (code) => {
    setEditorCode(code);
    setPendingDelete(codeRequestSong);
    setCodeRequestSong(null);
  };
  const closePicker = useCallback(() => setPickerSong(null), []);

  // Adds the song to (include = true) or removes it from a sub-list.
  const toggleSetlist = async (setlist, song, include) => {
    const rows = setlist.setlist_songs ?? [];
    let error;
    let nextRows;

    if (include) {
      const position = rows.reduce((max, r) => Math.max(max, r.position ?? 0), -1) + 1;
      ({ error } = await addSongToSetlist(setlist.id, song.id, position));
      nextRows = [...rows, { song_id: song.id, position }];
    } else {
      ({ error } = await removeSongFromSetlist(setlist.id, song.id));
      nextRows = rows.filter((r) => r.song_id !== song.id);
    }

    if (error) {
      console.error("Error updating setlist:", error.message);
      return false;
    }
    setSetlists((prev) =>
      prev.map((s) => (s.id === setlist.id ? { ...s, setlist_songs: nextRows } : s))
    );
    return true;
  };

  const confirmDelete = async () => {
    const song = pendingDelete;
    setDeleting(true);
    const { error } = await deleteSong(song.id, editorCode);
    setDeleting(false);
    setPendingDelete(null);

    if (error) {
      console.error("Error deleting song:", error.message);
      setStatusMessage(null);
      if (isInvalidCodeError(error)) {
        clearEditorCode();
        setEditorCode(null);
        setErrorMessage("Codul de editor s-a schimbat. Introdu-l din nou.");
      } else {
        setErrorMessage("Cântarea nu a putut fi ștearsă. Încearcă din nou.");
      }
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
              <SongCard
                key={song.id}
                song={song}
                plannedDates={plannedDates.get(song.id)}
                expanded={openSongId === song.id}
                onToggle={() => toggleSong(song.id)}
                onDelete={requestDelete}
                onAddToSetlist={setPickerSong}
              />
            ))}
          </ul>
        </section>
      ))}

      {showIndex && <LetterIndex letters={groups.map(([l]) => l)} onJump={jumpTo} />}

      {pickerSong && (
        <SetlistPickerSheet
          song={pickerSong}
          setlists={setlists}
          error={setlistsError}
          onToggle={(setlist, include) => toggleSetlist(setlist, pickerSong, include)}
          onClose={closePicker}
        />
      )}

      {codeRequestSong && (
        <EditorCodeSheet onValid={acceptCode} onClose={cancelCodeRequest} />
      )}

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
