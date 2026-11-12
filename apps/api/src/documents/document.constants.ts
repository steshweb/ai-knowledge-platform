export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_KNOWLEDGE_BASE = 3;
export const MAX_FILES_PER_UPLOAD = 5;
export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;

export const SUPPORTED_DOCUMENT_EXTENSIONS = ['.txt', '.md', '.markdown', '.pdf', '.docx'] as const;

export const SUPPORTED_DOCUMENT_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;
