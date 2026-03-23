import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export function createMarkoraTheme() {
  const theme = EditorView.theme(
    {
      "&": {
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
        fontSize: "15px",
        height: "100%",
      },
      ".cm-content": {
        fontFamily: "inherit",
        lineHeight: "1.75",
        padding: "16px 0",
        maxWidth: "800px",
        margin: "0 auto",
        caretColor: "var(--color-text)",
      },
      ".cm-scroller": {
        overflow: "auto",
        padding: "0 48px",
      },
      ".cm-cursor, &.cm-focused .cm-cursor": {
        borderLeftColor: "var(--color-text)",
      },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
        {
          backgroundColor: "var(--color-hover)",
        },
      ".cm-activeLine": {
        backgroundColor: "transparent",
      },
      ".cm-gutters": {
        display: "none",
      },
      ".cm-line": {
        padding: "0",
      },
    },
  );

  const highlightStyle = HighlightStyle.define([
    { tag: tags.heading1, fontWeight: "700", fontSize: "2em", color: "var(--color-heading)" },
    { tag: tags.heading2, fontWeight: "700", fontSize: "1.5em", color: "var(--color-heading)" },
    { tag: tags.heading3, fontWeight: "600", fontSize: "1.25em", color: "var(--color-heading)" },
    { tag: tags.heading4, fontWeight: "600", fontSize: "1em", color: "var(--color-heading)" },
    { tag: tags.heading5, fontWeight: "600", fontSize: "0.875em", color: "var(--color-heading)" },
    { tag: tags.heading6, fontWeight: "600", fontSize: "0.85em", color: "var(--color-heading)" },
    { tag: tags.strong, fontWeight: "700" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strikethrough, textDecoration: "line-through" },
    { tag: tags.link, color: "var(--color-link)", textDecoration: "underline" },
    { tag: tags.url, color: "var(--color-link)" },
    { tag: tags.monospace, fontFamily: "'SF Mono', 'Fira Code', monospace", backgroundColor: "var(--color-code-inline-bg)", borderRadius: "3px", padding: "0.2em 0.4em", fontSize: "0.9em" },
    { tag: tags.processingInstruction, color: "var(--color-text-muted)" },
    { tag: tags.quote, color: "var(--color-text-secondary)", fontStyle: "italic" },
    { tag: tags.meta, color: "var(--color-text-muted)" },
    { tag: tags.comment, color: "var(--color-text-muted)" },
    { tag: tags.keyword, color: "#cf222e" },
    { tag: tags.string, color: "#0a3069" },
    { tag: tags.number, color: "#0550ae" },
    { tag: tags.bool, color: "#0550ae" },
    { tag: tags.variableName, color: "#953800" },
    { tag: tags.definition(tags.variableName), color: "#953800" },
    { tag: tags.function(tags.variableName), color: "#8250df" },
    { tag: tags.typeName, color: "#0550ae" },
    { tag: tags.propertyName, color: "#0550ae" },
    { tag: tags.operator, color: "#24292f" },
  ]);

  return [theme, syntaxHighlighting(highlightStyle)];
}
