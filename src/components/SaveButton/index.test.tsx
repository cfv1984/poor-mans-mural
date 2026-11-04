import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SaveButton from ".";
import { persist } from "../../api";
import { makeNote, renderWithStore } from "../../test/utils";

vi.mock("../../api", async (importOriginal) => {
  const api = await importOriginal<typeof import("../../api")>();
  return { ...api, persist: vi.fn(api.persist) };
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

async function setup(notes = [makeNote()]) {
  const view = await renderWithStore(<SaveButton />, notes);
  vi.mocked(persist).mockClear();
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  return { ...view, button: screen.getByRole("button", { name: "Save" }) };
}

describe("SaveButton", () => {
  beforeEach(() => {
    vi.mocked(persist).mockClear();
  });

  it("saves the notes currently in the store", async () => {
    const a = makeNote({ id: "a" });
    const b = makeNote({ id: "b" });
    const { button } = await setup([a, b]);

    fireEvent.click(button);
    await advance(300);

    expect(persist).toHaveBeenCalledExactlyOnceWith([a, b]);
  });

  it("does not save notes that were removed from the store", async () => {
    const a = makeNote({ id: "a" });
    const b = makeNote({ id: "b" });
    const { button, dispatch } = await setup([a, b]);

    dispatch({ type: "remove", payload: "a" });
    fireEvent.click(button);
    await advance(300);

    expect(persist).toHaveBeenCalledExactlyOnceWith([b]);
  });

  it("keeps the loading state for at least 300ms when the save is instant", async () => {
    const { button, store } = await setup();

    fireEvent.click(button);
    expect(store().loading).toBe(true);

    await advance(299);
    expect(store().loading).toBe(true);

    await advance(1);
    expect(store().loading).toBe(false);
  });

  it("keeps the loading state until a slow save finishes", async () => {
    const { button, store } = await setup();
    let finish!: (saved: boolean) => void;
    vi.mocked(persist).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );

    fireEvent.click(button);
    await advance(1000);
    expect(store().loading).toBe(true);

    await act(async () => finish(true));
    expect(store().loading).toBe(false);
  });

  it("clears the loading state when the save reports failure", async () => {
    const { button, store } = await setup();
    vi.mocked(persist).mockResolvedValueOnce(false);

    fireEvent.click(button);
    await advance(300);

    expect(store().loading).toBe(false);
  });
});
