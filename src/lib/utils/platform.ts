const isMac =
  typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");

/** Display name for the platform modifier key: "Cmd" on macOS, "Ctrl" elsewhere. */
export const modKey = isMac ? "Cmd" : "Ctrl";

/** Returns true if the platform modifier key is pressed (Cmd on macOS, Ctrl on Windows/Linux). */
export function isModKey(e: KeyboardEvent): boolean {
  return isMac ? e.metaKey : e.ctrlKey;
}

/** Extracts the filename from a path, handling both `/` (macOS/Linux) and `\` (Windows). */
export function extractFileName(path: string): string {
  return path.split(/[/\\]/).pop() ?? path;
}
