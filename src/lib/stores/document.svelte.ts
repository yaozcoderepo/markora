import type { Heading } from "../types/index.js";

export type TabMode = "edit" | "preview";

export interface Tab {
  id: string;
  path: string;
  fileName: string;
  rawContent: string;
  html: string;
  headings: Heading[];
  scrollTop: number;
  isDirty: boolean;
  mode: TabMode;
}

let tabs = $state<Tab[]>([]);
let activeTabId = $state<string | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

function getActiveTab(): Tab | undefined {
  return tabs.find((t) => t.id === activeTabId);
}

export function getTabs() {
  return {
    get list() {
      return tabs;
    },
    get activeId() {
      return activeTabId;
    },
    get active() {
      return getActiveTab();
    },
    get html() {
      return getActiveTab()?.html ?? "";
    },
    get headings() {
      return getActiveTab()?.headings ?? [];
    },
    get currentPath() {
      return getActiveTab()?.path ?? null;
    },
    get fileName() {
      return getActiveTab()?.fileName ?? null;
    },
    get rawContent() {
      return getActiveTab()?.rawContent ?? "";
    },
    get isDirty() {
      return getActiveTab()?.isDirty ?? false;
    },
    get mode(): TabMode {
      return getActiveTab()?.mode ?? "preview";
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
    get isEmpty() {
      return tabs.length === 0;
    },
  };
}

export function addTab(
  path: string,
  rawContent: string,
  html: string,
  headings: Heading[],
) {
  // If file is already open, switch to that tab
  const existing = tabs.find((t) => t.path === path);
  if (existing) {
    activeTabId = existing.id;
    existing.rawContent = rawContent;
    existing.html = html;
    existing.headings = headings;
    return;
  }

  const id = `tab-${Date.now()}`;
  const fileName = path.split("/").pop() ?? path;
  tabs.push({ id, path, fileName, rawContent, html, headings, scrollTop: 0, isDirty: false, mode: "preview" });
  activeTabId = id;
  error = null;
}

export function addNewTab() {
  const id = `tab-${Date.now()}`;
  tabs.push({
    id,
    path: "",
    fileName: "Untitled.md",
    rawContent: "",
    html: "",
    headings: [],
    scrollTop: 0,
    isDirty: false,
    mode: "edit",
  });
  activeTabId = id;
  error = null;
}

export function closeTab(id: string) {
  const idx = tabs.findIndex((t) => t.id === id);
  if (idx === -1) return;

  tabs.splice(idx, 1);

  if (activeTabId === id) {
    if (tabs.length === 0) {
      activeTabId = null;
    } else {
      const newIdx = Math.min(idx, tabs.length - 1);
      activeTabId = tabs[newIdx].id;
    }
  }
}

export function switchTab(id: string) {
  const current = getActiveTab();
  if (current) {
    const scrollEl = current.mode === "edit"
      ? document.querySelector(".cm-editor .cm-scroller")
      : document.querySelector(".viewer");
    current.scrollTop = scrollEl?.scrollTop ?? 0;
  }
  activeTabId = id;
}

export function updateRawContent(tabId: string, content: string) {
  const tab = tabs.find((t) => t.id === tabId);
  if (tab) {
    tab.rawContent = content;
    tab.isDirty = true;
  }
}

export function setTabMode(tabId: string, mode: TabMode) {
  const tab = tabs.find((t) => t.id === tabId);
  if (tab) {
    tab.mode = mode;
  }
}

export function markSaved(tabId: string, path?: string) {
  const tab = tabs.find((t) => t.id === tabId);
  if (tab) {
    tab.isDirty = false;
    if (path) {
      tab.path = path;
      tab.fileName = path.split("/").pop() ?? path;
    }
  }
}

export function updateTabContent(path: string, rawContent: string, html: string, headings: Heading[]) {
  const tab = tabs.find((t) => t.path === path);
  if (tab) {
    // Don't overwrite user's unsaved edits
    if (tab.isDirty) return;
    tab.rawContent = rawContent;
    tab.html = html;
    tab.headings = headings;
  }
}

export function setLoading(loading: boolean) {
  isLoading = loading;
}

export function setError(err: string) {
  error = err;
  isLoading = false;
}
