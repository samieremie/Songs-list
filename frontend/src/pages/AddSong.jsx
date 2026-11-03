import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SongForm from "../components/SongForm";
import EditorCodeForm from "../components/EditorCodeForm";
import { addSong, isInvalidCodeError } from "../api/songs";
import { clearEditorCode, getEditorCode } from "../utils/editorCode";
import "../css/AddSong.css";

function AddSong() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(getEditorCode);
  const [codeNotice, setCodeNotice] = useState(null);
  const [addError, setAddError] = useState(null);

  async function handleAddSong({ title, musicScale }) {
    const { error } = await addSong({ title, musicScale, code });
    if (error) {
      console.error("Error adding song:", error.message);
      if (isInvalidCodeError(error)) {
        clearEditorCode();
        setCode(null);
        setAddError(null);
        setCodeNotice("Codul de editor s-a schimbat. Introdu-l din nou.");
      } else {
        setAddError("Cântarea nu a putut fi adăugată. Încearcă din nou.");
      }
      return false;
    }
    navigate("/", { state: { added: title } });
    return true;
  }

  const acceptCode = (validCode) => {
    setCode(validCode);
    setCodeNotice(null);
  };

  return (
    <section className="add-page">
      <h1 className="page-title">Adaugă o cântare</h1>
      {code ? (
        <>
          <p className="page-lede">Apare imediat în lista tuturor.</p>
          <SongForm onSubmit={handleAddSong} initialTitle={location.state?.title ?? ""} />
          {addError && (
            <p className="error-message add-error" role="alert">
              {addError}
            </p>
          )}
        </>
      ) : (
        <EditorCodeForm onValid={acceptCode} notice={codeNotice} />
      )}
    </section>
  );
}

export default AddSong;
