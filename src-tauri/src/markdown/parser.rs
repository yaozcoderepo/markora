use comrak::{
    arena_tree::Node,
    nodes::{Ast, NodeHeading, NodeValue},
    parse_document, Arena, ExtensionOptions, Options, ParseOptions, RenderOptions,
};
use serde::Serialize;
use std::cell::RefCell;

#[derive(Debug, Serialize, Clone)]
pub struct Heading {
    pub level: u8,
    pub text: String,
    pub id: String,
}

#[derive(Debug, Serialize)]
pub struct ParsedDocument {
    pub html: String,
    pub headings: Vec<Heading>,
}

fn build_options() -> Options<'static> {
    let mut options = Options::default();

    // GFM extensions
    options.extension = ExtensionOptions {
        strikethrough: true,
        table: true,
        autolink: true,
        tasklist: true,
        footnotes: true,
        ..Default::default()
    };

    options.parse = ParseOptions {
        smart: true,
        ..Default::default()
    };

    options.render = RenderOptions {
        unsafe_: true, // Allow raw HTML in markdown
        sourcepos: true, // Add data-sourcepos attributes for editor line mapping
        ..Default::default()
    };

    options
}

fn extract_text<'a>(node: &'a Node<'a, RefCell<Ast>>) -> String {
    let mut text = String::new();
    for child in node.children() {
        match &child.data.borrow().value {
            NodeValue::Text(t) => text.push_str(t),
            NodeValue::Code(c) => text.push_str(&c.literal),
            _ => text.push_str(&extract_text(child)),
        }
    }
    text
}

fn slugify(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

fn extract_headings<'a>(node: &'a Node<'a, RefCell<Ast>>) -> Vec<Heading> {
    let mut headings = Vec::new();

    for child in node.children() {
        if let NodeValue::Heading(NodeHeading { level, .. }) = &child.data.borrow().value {
            let text = extract_text(child);
            let id = slugify(&text);
            headings.push(Heading {
                level: *level,
                text,
                id,
            });
        }
        // Headings are top-level, no need to recurse deeply
    }

    headings
}

pub fn parse_markdown(content: &str) -> ParsedDocument {
    let arena = Arena::new();
    let options = build_options();

    let root = parse_document(&arena, content, &options);

    let headings = extract_headings(root);

    // Add IDs to heading nodes for anchor links
    // We do this by rendering to HTML and then post-processing
    let mut html = Vec::new();
    comrak::format_html(root, &options, &mut html).unwrap();
    let mut html_string = String::from_utf8(html).unwrap();

    // Inject heading IDs into the rendered HTML
    // Search for "<h{level} data-sourcepos=" to avoid re-matching already-processed headings
    for heading in &headings {
        let tag = format!("<h{} data-sourcepos=", heading.level);
        let tag_with_id = format!("<h{} id=\"{}\" data-sourcepos=", heading.level, heading.id);
        if let Some(pos) = html_string.find(&tag) {
            html_string = format!(
                "{}{}{}",
                &html_string[..pos],
                tag_with_id,
                &html_string[pos + tag.len()..]
            );
        }
    }

    ParsedDocument {
        html: html_string,
        headings,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_markdown() {
        let result = parse_markdown("# Hello\n\nWorld");
        assert!(result.html.contains("Hello"));
        assert!(result.html.contains("World"));
        assert_eq!(result.headings.len(), 1);
        assert_eq!(result.headings[0].text, "Hello");
        assert_eq!(result.headings[0].level, 1);
    }

    #[test]
    fn test_gfm_table() {
        let md = "| A | B |\n|---|---|\n| 1 | 2 |";
        let result = parse_markdown(md);
        assert!(result.html.contains("<table"));
    }

    #[test]
    fn test_task_list() {
        let md = "- [x] Done\n- [ ] Todo";
        let result = parse_markdown(md);
        assert!(result.html.contains("checked"));
    }

    #[test]
    fn test_code_block_language_class() {
        let md = "```rust\nfn main() {}\n```";
        let result = parse_markdown(md);
        assert!(result.html.contains("language-rust"));
    }

    #[test]
    fn test_heading_ids() {
        let md = "# Hello World\n## Sub Section";
        let result = parse_markdown(md);
        assert!(result.html.contains("id=\"hello-world\""));
        assert!(result.html.contains("id=\"sub-section\""));
    }
}
