import type { TextKey } from "../i18n";

export type WorldId = "meadow" | "desert" | "snow" | "city";

export interface Theme {
  id: WorldId;
  name: TextKey;
  skyTop: string;
  skyBottom: string;
  far: string; // far background layer
  near: string; // near background layer
  ground: string;
  groundDark: string;
  top: string; // grass / sand / snow band
  backdrop: "hills" | "dunes" | "mountains" | "city";
  decor: "tree" | "cactus" | "pine" | "lamp";
  clouds: boolean;
  night: boolean;
  snowfall: boolean;
}

export const THEMES: Record<WorldId, Theme> = {
  meadow: {
    id: "meadow",
    name: "world.meadow",
    skyTop: "#8FD3FF",
    skyBottom: "#E6F7FF",
    far: "#C9EFA9",
    near: "#A6E07E",
    ground: "#8B5A2B",
    groundDark: "#7A4E25",
    top: "#5BC236",
    backdrop: "hills",
    decor: "tree",
    clouds: true,
    night: false,
    snowfall: false,
  },
  desert: {
    id: "desert",
    name: "world.desert",
    skyTop: "#FFC97A",
    skyBottom: "#FFF0D2",
    far: "#F6D9A4",
    near: "#EFC27F",
    ground: "#D9934A",
    groundDark: "#C47F3B",
    top: "#F4CF7A",
    backdrop: "dunes",
    decor: "cactus",
    clouds: false,
    night: false,
    snowfall: false,
  },
  snow: {
    id: "snow",
    name: "world.snow",
    skyTop: "#A9D8F5",
    skyBottom: "#EEF8FF",
    far: "#D6E8F7",
    near: "#BFD6EC",
    ground: "#8C9DB8",
    groundDark: "#7B8BA6",
    top: "#FFFFFF",
    backdrop: "mountains",
    decor: "pine",
    clouds: true,
    night: false,
    snowfall: true,
  },
  city: {
    id: "city",
    name: "world.city",
    skyTop: "#27336B",
    skyBottom: "#6A6FB0",
    far: "#3B4580",
    near: "#4C5797",
    ground: "#5C5F73",
    groundDark: "#4E5164",
    top: "#9EA3B8",
    backdrop: "city",
    decor: "lamp",
    clouds: false,
    night: true,
    snowfall: false,
  },
};
