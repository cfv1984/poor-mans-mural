import type { Props as Note } from "../components/Note/types";

const NOTES_KEY = "poor-mans-mural:notes";

export async function persist(notes: Note[]): Promise<boolean> {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
}

export async function load(): Promise<Note[]> {
  try {
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) ?? "[]");
    return Array.isArray(notes) ? notes : [];
  } catch {
    return [];
  }
}
