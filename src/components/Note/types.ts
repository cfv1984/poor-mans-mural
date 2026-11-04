export enum Colors {
  RED = "tomato",
  GREEN = "limegreen",
  BLUE = "aqua",
  YELLOW = "gold",
}

export type Color = `${Colors}`;

export type Props = {
  id: string;
  title?: string;
  contents?: string;
  position: [number, number];
  dimensions: [number, number];
  color: Color;
  zIndex?: number;
};
