import {
  createContext,
  useReducer,
  type Dispatch,
  type PropsWithChildren,
} from "react";
import { type Props as Note } from "../components/Note/types";

enum ActionTypes {
  ADD = "add",
  REMOVE = "remove",
  EDIT = "edit",
  MOVE = "move",
  RESIZE = "resize",
}

type ActionPayloads = {
  [ActionTypes.ADD]: {
    note: Note;
  };
  [ActionTypes.REMOVE]: {
    id: string;
  };
  [ActionTypes.EDIT]: {
    note: Note;
  };
  [ActionTypes.MOVE]: { id: string; pos: [number, number] };
  [ActionTypes.RESIZE]: { id: string; size: [number, number] };
};

type RootState = {
  notes: Note[];
};

type Action = {
  [T in ActionTypes]: {
    type: `${T}`;
    payload: ActionPayloads[T];
  };
}[ActionTypes];

export default function Reducer(
  state: RootState,
  { payload, type }: Action,
): RootState {
  switch (type) {
    case ActionTypes.ADD:
      const notes = [...state.notes, payload.note];
      return {
        notes,
      };
      break;
    case "edit":
      return {
        notes: state.notes.reduce((all, next) => {
          all.push(next.id === payload.note.id ? payload.note : next);
          return all;
        }, [] as Note[]),
      };
      break;

    case "remove":
      const copy = [...state.notes];
      const pos = copy.findIndex((n) => n.id === payload.id);
      copy.splice(pos, 1);
      return {
        notes: copy,
      };
      break;
    case "move":
      return {
        notes: state.notes.reduce((all, next) => {
          if (next.id === payload.id) {
            all.push({
              ...next,
              position: [...payload.pos],
            });
          } else {
            all.push(next);
          }
          return all;
        }, [] as Note[]),
      };
      break;
    case "resize":
      return {
        notes: state.notes.reduce((all, next) => {
          if (next.id === payload.id) {
            all.push({
              ...next,
              dimensions: [...payload.size],
            });
          } else {
            all.push(next);
          }
          return all;
        }, [] as Note[]),
      };
      break;
  }
  throw new Error("Unknown action");
}

export const Context = createContext<[RootState, Dispatch<Action>] | null>(null);

export function StoreProvider({ children }: PropsWithChildren) {
const { Provider } = Context;
  const [store, dispatch] = useReducer(Reducer, {
    notes: [],
  });

  return <Provider value={[store, dispatch]}>{children}</Provider>;
}
