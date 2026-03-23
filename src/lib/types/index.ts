export interface Heading {
  level: number;
  text: string;
  id: string;
}

export interface ParsedDocument {
  html: string;
  headings: Heading[];
}
