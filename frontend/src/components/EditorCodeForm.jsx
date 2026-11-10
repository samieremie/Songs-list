import { useState } from "react";
import { checkEditorCode } from "../api/songs";
import { saveEditorCode } from "../utils/editorCode";
import "../css/EditorCodeForm.css";

// Asks for the shared editor code, checks it with Supabase and remembers it
// on this device. Calls onValid(code) once the code is right.
function EditorCodeForm({ onValid, notice }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setError("Scrie codul de editor.");
      return;
    }

    setChecking(true);
    const { data, error: checkError } = await checkEditorCode(cleanCode);
    setChecking(false);

    if (checkError) {
      console.error("Error checking editor code:", checkError.message);
      setError("Codul nu a putut fi verificat. Încearcă din nou.");
      return;
    }
    if (data !== true) {
      setError("Cod greșit. Încearcă din nou.");
      return;
    }
    setError(null);
    saveEditorCode(cleanCode);
    onValid(cleanCode);
  };

  return (
    <form className="editor-code-form" onSubmit={handleSubmit} noValidate>
      {notice && (
        <p className="error-message" role="alert">
          {notice}
        </p>
      )}
      <div className="field">
        <label htmlFor="editor-code">Cod de editor</label>
        <input
          id="editor-code"
          type="password"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "editor-code-error editor-code-hint" : "editor-code-hint"}
        />
        <p id="editor-code-hint" className="editor-code-hint">
          Doar responsabilii pot adăuga, modifica sau șterge cântări.
        </p>
        {error && (
          <p id="editor-code-error" className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn-sun editor-code-submit" disabled={checking}>
        {checking ? "Se verifică…" : "Continuă"}
      </button>
    </form>
  );
}

export default EditorCodeForm;
