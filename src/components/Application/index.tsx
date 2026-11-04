import World from "../World";
import LoadingIcon from "../LoadingIcon";
import ErrorBoundary from "../ErrorBoundary";
import { StoreProvider } from "../../store";

export default function Application() {
  return (
    <StoreProvider>
      <ErrorBoundary>
        <World />
      </ErrorBoundary>
      <LoadingIcon />
    </StoreProvider>
  );
}
