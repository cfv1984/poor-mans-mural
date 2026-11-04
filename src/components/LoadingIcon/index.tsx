import { LoaderCircle } from "lucide-react";
import { useStore } from "../../store";
import { overlay, icon } from "./index.module.css";

export default function LoadingIcon() {
  const [store] = useStore();

  if (!store.loading) {
    return null;
  }

  return (
    <div className={overlay} role="status" aria-label="Saving">
      <LoaderCircle className={icon} size={64} />
    </div>
  );
}
