import { invoke } from "@tauri-apps/api/core";
import type { ParsedDocument } from "../types/index.js";

export async function openFile(path: string): Promise<string> {
  return invoke<string>("open_file", { path });
}

export async function parseMarkdown(content: string): Promise<ParsedDocument> {
  return invoke<ParsedDocument>("parse_markdown", { content });
}

export async function watchFile(path: string): Promise<void> {
  return invoke("watch_file", { path });
}

export async function unwatchFile(): Promise<void> {
  return invoke("unwatch_file");
}
