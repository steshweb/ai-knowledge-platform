import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentParserService } from './document-parser.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentParserService],
})
export class DocumentsModule {}
