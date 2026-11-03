import { useRef } from "react";
import Sheet from "./Sheet";

// Asks the user to confirm a destructive action. Focus starts on "cancel".
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

  return (
    <Sheet
      title={title}
      description={message}
      role="alertdialog"
      initialFocusRef={cancelRef}
      onClose={onCancel}
    >
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
    </Sheet>
  );
}

export default ConfirmSheet;
