/**
 * Splits input text into overlapping chunks of a given character size.
 * Tries to avoid splitting words in half by finding local space boundaries.
 * 
 * @param {string} text - Raw text to chunk.
 * @param {number} size - Maximum characters per chunk (default 1000).
 * @param {number} overlap - Number of characters to overlap (default 200).
 * @returns {string[]} Array of text chunks.
 */
export const chunkText = (text, size = 1000, overlap = 200) => {
  if (!text) return [];
  
  // Clean up excessive whitespace/newlines
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const chunks = [];
  let start = 0;

  while (start < normalizedText.length) {
    let end = start + size;
    if (end > normalizedText.length) {
      end = normalizedText.length;
    } else {
      // Find the last space before end to avoid cutting words
      const lastSpace = normalizedText.lastIndexOf(" ", end);
      // Only adjust if the last space is reasonably close to the chunk size end
      if (lastSpace > start + size - 100) {
        end = lastSpace;
      }
    }

    const chunk = normalizedText.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    // Move start forward, keeping the overlap
    start = end - overlap;
    
    // Safety check to prevent infinite loop if overlap >= size
    if (size - overlap <= 0 || start >= normalizedText.length || end === normalizedText.length) {
      break;
    }
  }

  return chunks;
};
