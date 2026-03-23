import { createHighlighter, type Highlighter } from "shiki";

let highlighter: Highlighter | null = null;

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "rust",
  "go",
  "java",
  "bash",
  "json",
  "yaml",
  "html",
  "css",
  "sql",
  "c",
  "cpp",
  "markdown",
  "toml",
  "xml",
  "swift",
  "kotlin",
  "ruby",
  "php",
  "dockerfile",
  "graphql",
];

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: LANGUAGES,
    });
  }
  return highlighter;
}

export async function highlightCodeBlocks(
  container: HTMLElement,
  theme: "github-light" | "github-dark",
): Promise<void> {
  const hl = await getHighlighter();
  const codeBlocks = container.querySelectorAll("pre code[class*='language-']");

  for (const block of codeBlocks) {
    const className = block.className;
    const langMatch = className.match(/language-(\w+)/);
    if (!langMatch) continue;

    const lang = langMatch[1];
    const code = block.textContent || "";

    const loadedLangs = hl.getLoadedLanguages();
    if (!loadedLangs.includes(lang as any)) continue;

    const highlighted = hl.codeToHtml(code, { lang, theme });

    // Replace the entire <pre> with the highlighted version
    const pre = block.parentElement;
    if (pre && pre.tagName === "PRE") {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = highlighted;
      const newPre = wrapper.firstElementChild;
      if (newPre) {
        pre.replaceWith(newPre);
      }
    }
  }
}
