export function stripMarkdown(text: string): string {
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')

    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')

    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')

    // Remove bold and italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')

    // Remove strikethrough
    .replace(/~~(.*?)~~/g, '$1')

    // Remove blockquotes
    .replace(/^\s*>\s+/gm, '')

    // Remove horizontal rules
    .replace(/^[\-*_]{3,}\s*$/gm, '')

    // Remove list markers
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')

    // Remove extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}