import World from "../World";
import { StoreProvider } from "../../store";

export default function Application() {
  return (
    <StoreProvider>
        <World />
    </StoreProvider>
  );
}
