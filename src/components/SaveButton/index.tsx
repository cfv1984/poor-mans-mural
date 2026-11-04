import { useCallback } from "react";
import { useStore } from "../../store";
import { button } from "./index.module.css";
import { persist } from "../../api";

const MIN_LOADING_MS = 300;

export default function SaveButton() {
  const [store, dispatch] = useStore();

  const showLoadingIcon = () => dispatch({ type: "showLoading" });
  const hideLoadingIcon = () => dispatch({ type: "hideLoading" });

  const handleClick = useCallback(() => {
    showLoadingIcon();
    const minLoading = new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS));
    Promise.all([persist(store.notes), minLoading]).then(hideLoadingIcon);
  }, [store]);

  return (
    <button className={button} onClick={handleClick}>
      Save
    </button>
  );
}
