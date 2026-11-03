import { useEffect, useId, useRef } from "react";
import "../css/Sheet.css";

// Bottom sheet: dims the page, closes on Escape or a tap outside, moves focus
// inside while open and gives it back to the trigger when closed.
function Sheet({ title, description, role = "dialog", initialFocusRef, onClose, children }) {
  const sheetRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const target =
      initialFocusRef?.current ??
      sheetRef.current?.querySelector("button, input, a[href], [tabindex]");
    target?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose, initialFocusRef]);

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        ref={sheetRef}
        className="sheet"
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="sheet-title">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="sheet-message">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

export default Sheet;
