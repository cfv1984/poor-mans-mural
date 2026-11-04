import World from "../World";
import LoadingIcon from "../LoadingIcon";
import { StoreProvider } from "../../store";

export default function Application() {
  return (
    <StoreProvider>
      <World />
      <LoadingIcon />
    </StoreProvider>
  );
}
