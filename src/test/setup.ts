import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

Element.prototype.setPointerCapture = () => {};
document.hasFocus = () => true;

beforeEach(() => {
  vi.spyOn(document.body, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 1024, 768));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
