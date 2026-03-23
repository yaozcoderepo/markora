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

  // Add copy buttons to all <pre> blocks
  addCopyButtons(container);
}

const COPY_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"/></svg>`;
const CHECK_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>`;

function addCopyButtons(container: HTMLElement) {
  const preBlocks = container.querySelectorAll("pre");

  for (const pre of preBlocks) {
    // Skip if already has a copy button
    if (pre.querySelector(".code-copy-btn")) continue;

    const btn = document.createElement("button");
    btn.className = "code-copy-btn";
    btn.title = "Copy code";
    btn.innerHTML = COPY_ICON;

    btn.addEventListener("click", async () => {
      const code = pre.querySelector("code");
      const text = code?.textContent ?? pre.textContent ?? "";

      try {
        await navigator.clipboard.writeText(text);
        btn.innerHTML = CHECK_ICON;
        btn.classList.add("copied");
        setTimeout(() => {
          btn.innerHTML = COPY_ICON;
          btn.classList.remove("copied");
        }, 1500);
      } catch {
        // Fallback: silently fail
      }
    });

    pre.style.position = "relative";
    pre.appendChild(btn);
  }
}
