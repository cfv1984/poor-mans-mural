import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useStore } from "../../store";
import { useNoteDrag } from "../../hooks/useNoteDrag";
import type { Props } from "./types";
import { HandleBottomRight } from "lucide-react";

const MIN_SIZE = 50;
import { note, noteFields, noteField, noteHandle } from "./index.module.css";

const blurOnKeys =
  (...keys: string[]) =>
  (e: KeyboardEvent<HTMLElement>) => {
    if (keys.includes(e.key)) e.currentTarget.blur();
  };

export default function Note(props: Props) {
  const { id, contents, title, position, dimensions, color, zIndex } = props;
  const [, dispatch] = useStore();
  const [draft, setDraft] = useState<{ title: string; contents: string } | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const finishEditing = () => {
    if (!draft) return;
    setDraft(null);
    if (draft.title !== (title) || draft.contents !== (contents)) {
      dispatch({ type: "edit", payload: { ...props, ...draft } });
    }
  };

  const fieldProps = {
    className: noteField,
    readOnly: !draft,
    tabIndex: draft ? 0 : -1,
    onPointerDown: draft ? (e: PointerEvent<HTMLElement>) => e.stopPropagation() : undefined,
  };

  const { offset, onPointerDown } = useNoteDrag(position, (pos) => {
    dispatch({ type: "move", payload: { id, pos } });
  });

  const { offset: sizeOffset, onPointerDown: onResizePointerDown } = useNoteDrag(
    dimensions,
    ([w, h]) => {
      dispatch({
        type: "resize",
        payload: { id, size: [Math.max(MIN_SIZE, w), Math.max(MIN_SIZE, h)] },
      });
    },
  );

  const left = position[0] + offset.x;
  const top = position[1] + offset.y;
  const width = Math.max(MIN_SIZE, dimensions[0] + sizeOffset.x);
  const height = Math.max(MIN_SIZE, dimensions[1] + sizeOffset.y);

  return (
    <section
      id={id}
      className={`notes ${note}`}
      data-pos={position}
      data-dimensions={dimensions}
      onPointerDownCapture={() => dispatch({ type: "front", payload: id })}
      onPointerDown={onPointerDown}
      onDoubleClick={() => {
        if (draft) return;
        setDraft({ title: title ?? "", contents: contents ?? "" });
        titleRef.current?.focus();
      }}
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        zIndex,
        overflow: "hidden",
        background: color,
        userSelect: "none",
      }}
    >
      <div
        className={noteFields}
        onBlur={(e) => {
          if (document.hasFocus() && !e.currentTarget.contains(e.relatedTarget as Node | null)) {
            finishEditing();
          }
        }}
      >
        <input
          {...fieldProps}
          ref={titleRef}
          placeholder="Title"
          value={draft ? draft.title : (title ?? "")}
          onChange={(e) => draft && setDraft({ ...draft, title: e.target.value })}
          onKeyDown={blurOnKeys("Enter", "Escape")}
        />
        <textarea
          {...fieldProps}
          placeholder="Write something..."
          value={draft ? draft.contents : (contents ?? "")}
          onChange={(e) => draft && setDraft({ ...draft, contents: e.target.value })}
          onKeyDown={blurOnKeys("Escape")}
        />
      </div>
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          onResizePointerDown(e);
        }}
        onDoubleClick={(e) => e.stopPropagation()}
        className={noteHandle}
      >
        <HandleBottomRight />
      </div>
    </section>
  );
}
