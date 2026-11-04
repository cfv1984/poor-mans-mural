import { act, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { persist } from "../api";
import type { Props as Note } from "../components/Note/types";
import { StoreProvider, useStore } from "../store";

type Store = ReturnType<typeof useStore>;
type Action = Parameters<Store[1]>[0];

export function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "note-1",
    title: "Title",
    contents: "Contents",
    position: [100, 100],
    dimensions: [200, 150],
    color: "tomato",
    zIndex: 1,
    ...overrides,
  };
}

export async function flushLoad() {
  await act(async () => {});
}

export async function renderWithStore(ui: ReactNode, notes: Note[] = []) {
  await persist(notes);
  let current!: Store;
  function Probe() {
    current = useStore();
    return null;
  }
  const view = render(
    <StoreProvider>
      <Probe />
      {ui}
    </StoreProvider>,
  );
  await flushLoad();
  return {
    ...view,
    store: () => current[0],
    dispatch: (action: Action) => act(() => current[1](action)),
  };
}

export function stubRect(el: Element, x: number, y: number, width: number, height: number) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue(new DOMRect(x, y, width, height));
}

export function press(el: Element, x: number, y: number, init: PointerEventInit = {}) {
  return fireEvent.pointerDown(el, {
    pointerId: 1,
    button: 0,
    buttons: 1,
    clientX: x,
    clientY: y,
    ...init,
  });
}

export function moveTo(el: Element, x: number, y: number, init: PointerEventInit = {}) {
  return fireEvent.pointerMove(el, { pointerId: 1, buttons: 1, clientX: x, clientY: y, ...init });
}

// A move with no button held: plain hovering, or Chrome's stray move just before a release.
export function hover(el: Element, x: number, y: number) {
  return moveTo(el, x, y, { buttons: 0 });
}

export function release(el: Element, x: number, y: number, init: PointerEventInit = {}) {
  return fireEvent.pointerUp(el, {
    pointerId: 1,
    button: 0,
    buttons: 0,
    clientX: x,
    clientY: y,
    ...init,
  });
}
