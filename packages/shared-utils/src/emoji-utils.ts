export function getTwemojiUrl(emoji: string): string {
  const cp = [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    //.filter((x) => x !== 'fe0f')
    .join('-');
  // return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;
  return `https://cdn.jsdelivr.net/gh/realityripple/emoji/whatsapp/${cp}.png`;
}
