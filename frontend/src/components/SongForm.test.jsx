import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SongForm from "./SongForm";

describe("SongForm", () => {
  it("submits trimmed title and music scale, then clears the fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SongForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Titlu"), "  Ce bine e ");
    await user.type(screen.getByLabelText("Gama"), "Re major");
    await user.click(screen.getByRole("button", { name: "Adaugă cântarea" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Ce bine e",
      musicScale: "Re major",
    });
    expect(screen.getByLabelText("Titlu")).toHaveValue("");
    expect(screen.getByLabelText("Gama")).toHaveValue("");
  });

  it("shows a Romanian message and does not submit when a field is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SongForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Titlu"), "Ce bine e");
    await user.click(screen.getByRole("button", { name: "Adaugă cântarea" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Scrie gama, de exemplu Re major.")).toBeInTheDocument();
    expect(screen.getByLabelText("Gama")).toHaveAttribute("aria-invalid", "true");
  });

  it("keeps the fields when saving fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(<SongForm onSubmit={onSubmit} initialTitle="Aleluia" />);

    await user.type(screen.getByLabelText("Gama"), "Sol");
    await user.click(screen.getByRole("button", { name: "Adaugă cântarea" }));

    expect(screen.getByLabelText("Titlu")).toHaveValue("Aleluia");
    expect(screen.getByLabelText("Gama")).toHaveValue("Sol");
  });

  it("can edit an existing song: prefilled, custom label, fields kept after saving", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <SongForm
        onSubmit={onSubmit}
        initialTitle="Aleluia"
        initialMusicScale="Sol"
        submitLabel="Salvează"
        resetOnSuccess={false}
      />
    );

    expect(screen.getByLabelText("Gama")).toHaveValue("Sol");
    await user.clear(screen.getByLabelText("Gama"));
    await user.type(screen.getByLabelText("Gama"), "Mi");
    await user.click(screen.getByRole("button", { name: "Salvează" }));

    expect(onSubmit).toHaveBeenCalledWith({ title: "Aleluia", musicScale: "Mi" });
    expect(screen.getByLabelText("Titlu")).toHaveValue("Aleluia");
    expect(screen.getByLabelText("Gama")).toHaveValue("Mi");
  });
});
