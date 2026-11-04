import { useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Point } from "./types";

export function useNoteDrag(position: [number, number], onDrop: (pos: [number, number]) => void) {
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);

    const start = { x: e.clientX, y: e.clientY };
    let delta = { x: 0, y: 0 };
    const onMove = (m: PointerEvent) => {
      delta = { x: m.clientX - start.x, y: m.clientY - start.y };
      setOffset(delta);
    };
    const stop = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", stop);
      setOffset({ x: 0, y: 0 });
    };
    const onUp = () => {
      stop();
      if (delta.x || delta.y) onDrop([position[0] + delta.x, position[1] + delta.y]);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", stop);
  };

  return { offset, onPointerDown };
}
