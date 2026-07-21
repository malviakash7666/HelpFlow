import fs from "fs/promises";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

/**
 * Extract raw text content from a file depending on its MIME type.
 * Supports PDF, DOCX, and TXT.
 * @param {string} filePath - Absolute path to the file.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<string>} The extracted raw text.
 */
export const extractText = async (filePath, mimeType) => {
  try {
    if (mimeType === "application/pdf") {
      const dataBuffer = await fs.readFile(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (mimeType === "text/plain") {
      return await fs.readFile(filePath, "utf8");
    } else {
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
  } catch (error) {
    console.error(`Text extraction failed for ${filePath} (${mimeType}):`, error);
    throw new Error(`Text extraction failed: ${error.message}`);
  }
};
