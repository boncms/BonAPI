/**
 * Utility function to clean markdown formatting from text
 * Removes common markdown syntax and emojis from AI-generated content
 */

export function cleanMarkdown(text: string): string {
  if (!text) return text

  return text
    // Remove bold formatting **text** -> text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove italic formatting *text* -> text
    .replace(/\*(.*?)\*/g, '$1')
    // Remove headers # Header -> Header
    .replace(/#{1,6}\s*/g, '')
    // Remove links [text](url) -> text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove code formatting `code` -> code
    .replace(/`(.*?)`/g, '$1')
    // Remove common emojis
    .replace(/[🔥💦⭐✨🎯🚀💯🎉🎊💎💪👑🔥💯]/g, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
}

/**
 * Clean markdown from title specifically
 * More aggressive cleaning for titles
 */
export function cleanTitleMarkdown(text: string): string {
  if (!text) return text

  return text
    // Remove all markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    // Remove all emojis using a simple approach
    .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, '') // Surrogate pairs
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // High surrogates
    .replace(/[\u2600-\u26FF]/g, '') // Misc symbols
    .replace(/[\u2700-\u27BF]/g, '') // Dingbats
    // Remove common emojis
    .replace(/[🔥💦⭐✨🎯🚀💯🎉🎊💎💪👑]/g, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
}

/**
 * Clean markdown from description specifically
 * Less aggressive cleaning for descriptions
 */
export function cleanDescriptionMarkdown(text: string): string {
  if (!text) return text

  return text
    // Remove bold formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove italic formatting
    .replace(/\*(.*?)\*/g, '$1')
    // Remove headers
    .replace(/#{1,6}\s*/g, '')
    // Remove links
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove code formatting
    .replace(/`(.*?)`/g, '$1')
    // Remove common emojis but keep some
    .replace(/[🔥💦⭐✨🎯🚀💯🎉🎊💎💪👑]/g, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
}
