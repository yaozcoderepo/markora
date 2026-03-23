import type { Heading } from "../types/index.js";

export interface Tab {
  id: string;
  path: string;
  fileName: string;
  html: string;
  headings: Heading[];
  scrollTop: number;
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
  html: string,
  headings: Heading[],
) {
  // If file is already open, switch to that tab
  const existing = tabs.find((t) => t.path === path);
  if (existing) {
    activeTabId = existing.id;
    // Update content in case it changed
    existing.html = html;
    existing.headings = headings;
    return;
  }

  const id = `tab-${Date.now()}`;
  const fileName = path.split("/").pop() ?? path;
  tabs.push({ id, path, fileName, html, headings, scrollTop: 0 });
  activeTabId = id;
  error = null;
}

export function closeTab(id: string) {
  const idx = tabs.findIndex((t) => t.id === id);
  if (idx === -1) return;

  tabs.splice(idx, 1);

  if (activeTabId === id) {
    // Switch to nearest tab
    if (tabs.length === 0) {
      activeTabId = null;
    } else {
      const newIdx = Math.min(idx, tabs.length - 1);
      activeTabId = tabs[newIdx].id;
    }
  }
}

export function switchTab(id: string) {
  // Save scroll position of current tab
  const current = getActiveTab();
  if (current) {
    const viewer = document.querySelector(".viewer");
    current.scrollTop = viewer?.scrollTop ?? 0;
  }
  activeTabId = id;
}

export function updateTabContent(path: string, html: string, headings: Heading[]) {
  const tab = tabs.find((t) => t.path === path);
  if (tab) {
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
