import { describe, it, expect, vi, afterEach } from "vitest";
import { clearEditorCode, getEditorCode, saveEditorCode } from "./editorCode";

describe("editorCode", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves, reads and clears the code", () => {
    expect(getEditorCode()).toBeNull();
    saveEditorCode("secret");
    expect(getEditorCode()).toBe("secret");
    clearEditorCode();
    expect(getEditorCode()).toBeNull();
  });

  it("does not throw when storage is unavailable", () => {
    const fail = () => {
      throw new Error("blocked");
    };
    vi.spyOn(window.localStorage, "getItem").mockImplementation(fail);
    vi.spyOn(window.localStorage, "setItem").mockImplementation(fail);
    vi.spyOn(window.localStorage, "removeItem").mockImplementation(fail);

    expect(() => saveEditorCode("secret")).not.toThrow();
    expect(getEditorCode()).toBeNull();
    expect(() => clearEditorCode()).not.toThrow();
  });
});
