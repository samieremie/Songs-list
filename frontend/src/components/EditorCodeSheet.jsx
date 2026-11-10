import Sheet from "./Sheet";
import EditorCodeForm from "./EditorCodeForm";

// The editor code form in a bottom sheet, used before editing or deleting a song.
function EditorCodeSheet({ onValid, onClose }) {
  return (
    <Sheet title="Introdu codul de editor" onClose={onClose}>
      <EditorCodeForm onValid={onValid} />
    </Sheet>
  );
}

export default EditorCodeSheet;
