export function getTwemojiUrl(emoji: string): string {
  const cp = [...emoji].map((c) => c.codePointAt(0)!.toString(16)).join('-');
  return `https://cdn.jsdelivr.net/gh/realityripple/emoji/whatsapp/${cp}.png`;
}
