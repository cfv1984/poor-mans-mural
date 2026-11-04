import { useEffect, useState } from "react";

const MIN_WIDTH = 1024;
const MIN_HEIGHT = 768;

function isTooSmall() {
  const { width, height } = document.body.getBoundingClientRect();
  return width < MIN_WIDTH || height < MIN_HEIGHT;
}

export function useMinScreenSize() {
  const [tooSmall, setTooSmall] = useState(isTooSmall);

  useEffect(() => {
    const onResize = () => setTooSmall(isTooSmall());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (tooSmall) throw new Error(`Screen is smaller than ${MIN_WIDTH}x${MIN_HEIGHT}`);
}
