import { useContext, useReducer } from "react";
import World from "../World";
import { StoreProvider } from "../../store";

export default function Application() {
  return (
    <StoreProvider>
      <main>
        <World />
      </main>
    </StoreProvider>
  );
}
