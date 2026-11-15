export interface IndexedWord {
  word: string;
  index: number;
}

export function splitIntoWords(text: string): IndexedWord[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => ({ word, index }));
}
