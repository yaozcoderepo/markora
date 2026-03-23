export type Theme = "light" | "dark" | "sepia";

let theme = $state<Theme>(getInitialTheme());
let outlineVisible = $state(true);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("markora-theme");
  if (saved === "light" || saved === "dark" || saved === "sepia") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getSettings() {
  return {
    get theme() {
      return theme;
    },
    get outlineVisible() {
      return outlineVisible;
    },
  };
}

export function setTheme(t: Theme) {
  theme = t;
  localStorage.setItem("markora-theme", t);
  document.documentElement.setAttribute("data-theme", t);
}

export function toggleOutline() {
  outlineVisible = !outlineVisible;
}

// Apply theme on load
export function initTheme() {
  document.documentElement.setAttribute("data-theme", theme);
}
