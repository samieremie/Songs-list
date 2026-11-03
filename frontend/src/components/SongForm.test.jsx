import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SongForm from "./SongForm";

describe("SongForm", () => {
  it("submits title and music scale, then clears the fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SongForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Titlu"), "Ce bine e");
    await user.type(screen.getByPlaceholderText("Gama"), "Re major");
    await user.click(screen.getByRole("button", { name: "Adaugă" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Ce bine e",
      musicScale: "Re major",
    });
    expect(screen.getByPlaceholderText("Titlu")).toHaveValue("");
    expect(screen.getByPlaceholderText("Gama")).toHaveValue("");
  });

  it("does not submit when a field is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SongForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Titlu"), "Ce bine e");
    await user.click(screen.getByRole("button", { name: "Adaugă" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
