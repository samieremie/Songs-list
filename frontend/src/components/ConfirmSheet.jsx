import { useEffect, useRef } from "react";
import "../css/ConfirmSheet.css";

// Bottom sheet asking the user to confirm a destructive action.
function ConfirmSheet({
  title,
  message,
  confirmLabel,
  cancelLabel,
  busy,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    cancelRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onCancel]);

  return (
    <div className="sheet-scrim" onClick={onCancel}>
      <div
        className="sheet"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        aria-describedby="sheet-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="sheet-title" className="sheet-title">
          {title}
        </h2>
        <p id="sheet-message" className="sheet-message">
          {message}
        </p>
        <div className="sheet-actions">
          <button
            type="button"
            className="btn btn-hibiscus"
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            ref={cancelRef}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmSheet;
