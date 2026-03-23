use crate::markdown::{self, ParsedDocument};

#[tauri::command]
pub fn parse_markdown(content: String) -> Result<ParsedDocument, String> {
    Ok(markdown::parse_markdown(&content))
}
