import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EMBEDDING_PROVIDER } from '../embeddings/embedding-provider';
import { GeminiEmbeddingProvider } from '../embeddings/gemini-embedding.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentParserService } from './document-parser.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentParserService,
    GeminiEmbeddingProvider,
    { provide: EMBEDDING_PROVIDER, useExisting: GeminiEmbeddingProvider },
  ],
})
export class DocumentsModule {}
