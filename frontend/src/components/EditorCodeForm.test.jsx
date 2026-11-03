import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSupabaseMock } from "../test/supabaseMock";

const mock = vi.hoisted(() => ({ current: null }));
vi.mock("../api/songsApi", () => ({
  default: { rpc: (...args) => mock.current.client.rpc(...args) },
}));

import EditorCodeForm from "./EditorCodeForm";

describe("EditorCodeForm", () => {
  beforeEach(() => {
    mock.current = createSupabaseMock({ data: true, error: null });
  });

  const submitCode = async (code) => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Cod de editor"), code);
    await user.click(screen.getByRole("button", { name: "Continuă" }));
  };

  it("accepts and remembers a correct code", async () => {
    const onValid = vi.fn();
    render(<EditorCodeForm onValid={onValid} />);

    await submitCode(" secret ");

    expect(mock.current.client.rpc).toHaveBeenCalledWith("check_editor_code", {
      p_code: "secret",
    });
    expect(onValid).toHaveBeenCalledWith("secret");
    expect(window.localStorage.getItem("editorCode")).toBe("secret");
  });

  it("rejects a wrong code", async () => {
    mock.current.query.result = { data: false, error: null };
    const onValid = vi.fn();
    render(<EditorCodeForm onValid={onValid} />);

    await submitCode("wrong");

    expect(screen.getByText("Cod greșit. Încearcă din nou.")).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("editorCode")).toBeNull();
  });

  it("asks for a code when the field is empty", async () => {
    const user = userEvent.setup();
    render(<EditorCodeForm onValid={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Continuă" }));

    expect(screen.getByText("Scrie codul de editor.")).toBeInTheDocument();
    expect(mock.current.client.rpc).not.toHaveBeenCalled();
  });

  it("shows an error when the check fails", async () => {
    mock.current.query.result = { data: null, error: { message: "network" } };
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<EditorCodeForm onValid={vi.fn()} />);

    await submitCode("secret");

    expect(
      screen.getByText("Codul nu a putut fi verificat. Încearcă din nou.")
    ).toBeInTheDocument();
  });
});
