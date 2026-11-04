import { useCallback, type MouseEvent, type RefObject } from "react";
import type { Point } from "./types";

export function useWorldClick(
  viewportRef: RefObject<HTMLElement | null>,
  cam: Point,
  dragged: { readonly current: boolean },
  onWorldClick: (p: Point) => void,
) {
  return useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const el = viewportRef.current;
      if (!el || dragged.current || e.target !== el) return;
      const r = el.getBoundingClientRect();
      onWorldClick({ x: e.clientX - r.left - cam.x, y: e.clientY - r.top - cam.y });
    },
    [viewportRef, cam, dragged, onWorldClick],
  );
}