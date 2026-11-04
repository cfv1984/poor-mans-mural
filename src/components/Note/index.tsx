import { useContext } from "react";
import { Context } from "../../store";
import { useNoteDrag } from "../../hooks/useNoteDrag";
import type { Props } from "./types";

export default function Note({ id, contents, title, position, dimensions, color }: Props) {
  const ctx = useContext(Context);
  const { offset, onPointerDown } = useNoteDrag(position, (pos) => {
    ctx?.[1]({ type: "move", payload: { id, pos } });
  });
  const left = position[0] + offset.x;
  const top = position[1] + offset.y;
  const [width, height] = dimensions;
  return (
    <section
      id={id}
      className="notes note"
      data-pos={position}
      data-dimensions={dimensions}
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        overflow: "hidden",
        background: color,
        userSelect: "none",
      }}
    >
      {title && (
        <header>
          <h3>{title}</h3>
        </header>
      )}
      {contents && <section>{contents}</section>}
    </section>
  );
}
