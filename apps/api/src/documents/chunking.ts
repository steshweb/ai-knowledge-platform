export function sanitizeText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[\uF0B7\u2022]/g, '-')
    .replace(/\r\n?/g, '\n')
    .replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gim, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ ]+\n/g, '\n')
    .replace(/\n[ ]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function splitTextIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  if (chunkSize <= 0) throw new Error('Chunk size must be greater than zero');
  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error('Chunk overlap must be non-negative and smaller than chunk size');
  }

  const normalizedText = sanitizeText(text);
  if (!normalizedText) return [];

  const chunks: string[] = [];
  const step = chunkSize - overlap;

  for (let start = 0; start < normalizedText.length; start += step) {
    const chunk = normalizedText.slice(start, start + chunkSize).trim();
    if (chunk) chunks.push(chunk);
    if (start + chunkSize >= normalizedText.length) break;
  }

  return chunks;
}
