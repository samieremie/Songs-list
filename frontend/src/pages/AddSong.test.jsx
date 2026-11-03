import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createSupabaseMock } from "../test/supabaseMock";

const mock = vi.hoisted(() => ({ current: null }));
vi.mock("../api/songsApi", () => ({
  default: { rpc: (...args) => mock.current.client.rpc(...args) },
}));

import AddSong from "./AddSong";

const renderAddSong = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/addsong", state }]}>
      <Routes>
        <Route path="/addsong" element={<AddSong />} />
        <Route path="/" element={<p>Lista principală</p>} />
      </Routes>
    </MemoryRouter>
  );

const fillSong = async (user) => {
  await user.type(screen.getByLabelText("Titlu"), "Ce bine e");
  await user.type(screen.getByLabelText("Gama"), "Re major");
  await user.click(screen.getByRole("button", { name: "Adaugă cântarea" }));
};

describe("AddSong", () => {
  beforeEach(() => {
    mock.current = createSupabaseMock({ data: true, error: null });
  });

  it("asks for the editor code before showing the form", () => {
    renderAddSong();

    expect(screen.getByLabelText("Cod de editor")).toBeInTheDocument();
    expect(screen.queryByLabelText("Titlu")).not.toBeInTheDocument();
  });

  it("adds the song with the code once it is accepted", async () => {
    const user = userEvent.setup();
    renderAddSong({ title: "Osana" });

    await user.type(screen.getByLabelText("Cod de editor"), "secret");
    await user.click(screen.getByRole("button", { name: "Continuă" }));

    expect(screen.getByLabelText("Titlu")).toHaveValue("Osana");
    await user.clear(screen.getByLabelText("Titlu"));
    await fillSong(user);

    expect(mock.current.client.rpc).toHaveBeenLastCalledWith("add_song", {
      p_title: "Ce bine e",
      p_music_scale: "Re major",
      p_code: "secret",
    });
    expect(screen.getByText("Lista principală")).toBeInTheDocument();
  });

  it("skips the code when this device already has it", async () => {
    window.localStorage.setItem("editorCode", "secret");
    const user = userEvent.setup();
    renderAddSong();

    await fillSong(user);

    expect(mock.current.client.rpc).toHaveBeenCalledWith(
      "add_song",
      expect.objectContaining({ p_code: "secret" })
    );
  });

  it("asks again when the stored code is no longer valid", async () => {
    window.localStorage.setItem("editorCode", "old");
    mock.current.query.result = {
      data: null,
      error: { code: "28000", message: "invalid_editor_code" },
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    renderAddSong();

    await fillSong(user);

    expect(
      screen.getByText("Codul de editor s-a schimbat. Introdu-l din nou.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Cod de editor")).toBeInTheDocument();
    expect(window.localStorage.getItem("editorCode")).toBeNull();
  });

  it("shows an error when the song cannot be added", async () => {
    window.localStorage.setItem("editorCode", "secret");
    mock.current.query.result = { data: null, error: { message: "boom" } };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    renderAddSong();

    await fillSong(user);

    expect(
      screen.getByText("Cântarea nu a putut fi adăugată. Încearcă din nou.")
    ).toBeInTheDocument();
  });
});
