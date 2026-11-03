// The shared editor code, remembered on this device so leaders type it once.
// Storage can be unavailable (private browsing, blocked site data); then the
// app simply asks for the code again.
const KEY = "editorCode";

export function getEditorCode() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveEditorCode(code) {
  try {
    window.localStorage.setItem(KEY, code);
  } catch {
    // Not remembered; the user will be asked again next time.
  }
}

export function clearEditorCode() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing stored that we could remove.
  }
}
