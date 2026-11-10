import Sheet from "./Sheet";
import SongForm from "./SongForm";

// Edit a song's title and key in a bottom sheet. onSave({ title, musicScale })
// resolves to false when saving failed, so the form keeps the typed values.
function EditSongSheet({ song, error, onSave, onClose }) {
  return (
    <Sheet title="Modifică cântarea" onClose={onClose}>
      <SongForm
        onSubmit={onSave}
        initialTitle={song.title}
        initialMusicScale={song.music_scale ?? ""}
        submitLabel="Salvează"
        submittingLabel="Se salvează…"
        resetOnSuccess={false}
      />
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  );
}

export default EditSongSheet;
