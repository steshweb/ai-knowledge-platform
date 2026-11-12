import type { DocumentStatus } from '@prisma/client';

export type ExtractedDocument = {
  text: string;
  status: DocumentStatus;
};
