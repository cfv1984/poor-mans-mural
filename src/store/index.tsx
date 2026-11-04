import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type PropsWithChildren,
} from "react";
import { load } from "../api";
import { type Props as Note } from "../components/Note/types";

enum ActionTypes {
  ADD = "add",
  REMOVE = "remove",
  EDIT = "edit",
  MOVE = "move",
  RESIZE = "resize",
  FRONT = "front",
  SHOW_LOADING = "showLoading",
  HIDE_LOADING = "hideLoading",
  LOAD = "load",
  HIGHLIGHT_TRASH = "highlightTrash",
}

type ActionPayloads = {
  [ActionTypes.ADD]: Omit<Note, "id">;
  [ActionTypes.REMOVE]: string;
  [ActionTypes.EDIT]: Note;
  [ActionTypes.MOVE]: { id: string; pos: [number, number] };
  [ActionTypes.RESIZE]: { id: string; size: [number, number] };
  [ActionTypes.FRONT]: string;
  [ActionTypes.SHOW_LOADING]: undefined;
  [ActionTypes.HIDE_LOADING]: undefined;
  [ActionTypes.LOAD]: Note[];
  [ActionTypes.HIGHLIGHT_TRASH]: boolean;
};

type RootState = {
  notes: Note[];
  loading: boolean;
  trashHighlighted: boolean;
};

type Action = {
  [T in ActionTypes]: ActionPayloads[T] extends undefined
    ? { type: `${T}`; payload?: undefined }
    : { type: `${T}`; payload: ActionPayloads[T] };
}[ActionTypes];

function nextZIndex(notes: Note[]) {
  return Math.max(0, ...notes.map((n) => n.zIndex ?? 0)) + 1;
}

export default function Reducer(state: RootState, { payload, type }: Action): RootState {
  switch (type) {
    case ActionTypes.ADD:
      const notes = [
        ...state.notes,
        { ...payload, zIndex: nextZIndex(state.notes), id: crypto.randomUUID() },
      ];
      return {
        ...state,
        notes,
      };
      break;
    case "edit":
      return {
        ...state,
        notes: state.notes.reduce((all, next) => {
          all.push(next.id === payload.id ? payload : next);
          return all;
        }, [] as Note[]),
      };
      break;

    case "remove":
      const copy = [...state.notes];
      const pos = copy.findIndex((n) => n.id === payload);
      if (pos >= 0) {
        copy.splice(pos, 1);
        return {
          ...state,
          notes: copy,
        };
      }
      break;
    case "move":
      return {
        ...state,
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
        ...state,
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
    case "front":
      const zIndex = nextZIndex(state.notes);
      return {
        ...state,
        notes: state.notes.map((n) => (n.id === payload ? { ...n, zIndex } : n)),
      };
      break;
    case "showLoading":
      return {
        ...state,
        loading: true,
      };
      break;
    case "hideLoading":
      return {
        ...state,
        loading: false,
      };
      break;
    case "load":
      return {
        ...state,
        notes: payload,
      };
      break;
    case "highlightTrash":
      return state.trashHighlighted === payload ? state : { ...state, trashHighlighted: payload };
  }
  throw new Error("Unknown action");
}

const Context = createContext<[RootState, Dispatch<Action>] | null>(null);

export function useStore() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}

export function StoreProvider({ children }: PropsWithChildren) {
  const { Provider } = Context;
  const [store, dispatch] = useReducer(Reducer, {
    notes: [],
    loading: false,
    trashHighlighted: false,
  });

  useEffect(() => {
    load().then((notes) => dispatch({ type: "load", payload: notes }));
  }, []);

  return <Provider value={[store, dispatch]}>{children}</Provider>;
}
