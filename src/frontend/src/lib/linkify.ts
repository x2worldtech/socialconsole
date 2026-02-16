/**
 * Utility functions for detecting and rendering URLs in text
 */

export interface TextPart {
  type: 'text' | 'link';
  content: string;
}

/**
 * Detects URLs in text and splits the text into parts (text and links)
 * Supports http and https protocols
 */
export function parseTextWithLinks(text: string): TextPart[] {
  // Regex to match http and https URLs
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  
  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    // Add the URL
    parts.push({
      type: 'link',
      content: match[0],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  // If no URLs were found, return the original text as a single part
  if (parts.length === 0) {
    parts.push({
      type: 'text',
      content: text,
    });
  }

  return parts;
}
