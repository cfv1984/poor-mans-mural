import { Trash2 } from "lucide-react";
import { useStore } from "../../store";
import { trash, highlighted } from "./index.module.css";

export default function Trash() {
  const [store] = useStore();

  return (
    <aside
      id="trash"
      className={store.trashHighlighted ? `${trash} ${highlighted}` : trash}
      aria-label="Trash"
    >
      <Trash2 size="50%" />
    </aside>
  );
}
