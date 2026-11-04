import { useCallback, useRef } from "react";
import { useStore } from "../../store";
import Note from "../Note";
import { world, viewport } from "./index.module.css";
import { usePan } from "../../hooks/usePan";
import { useWorldClick } from "../../hooks/useWorldClick";
import type { Point } from "../../hooks/types";
import { Colors, type Color } from "../Note/types";
import SaveButton from "../SaveButton";

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

const COLORS = Object.values(Colors);

export default function World() {
  const viewportRef = useRef<HTMLElement>(null);
  const { cam, dragged } = usePan(viewportRef);

  const [store, dispatch] = useStore();
  const wasEditing = useRef(false);
  const addNote = useCallback(
    ({ x, y }: Point) => {
      if (wasEditing.current) {
        return;
      }
      dispatch({
        type: "add",
        payload: {
          dimensions: [randomInt(100, 300), randomInt(100, 300)],
          position: [x, y],
          color: COLORS[Math.floor(Math.random() * COLORS.length)] as Color,
        },
      });
    },
    [dispatch],
  );
  const onClick = useWorldClick(viewportRef, cam, dragged, addNote);

  return (
    <main
      ref={viewportRef}
      onPointerDownCapture={() => {
        const active = document.activeElement;
        wasEditing.current =
          (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) &&
          !active.readOnly;
      }}
      onClick={onClick}
      className={viewport}
    >
      <section className={world} style={{ transform: `translate(${cam.x}px, ${cam.y}px)` }}>
        {store.notes.map((n) => (
          <Note key={n.id} {...n} />
        ))}
      </section>
      <SaveButton />
    </main>
  );
}
