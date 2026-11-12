import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import type { Express } from 'express';
import { AuthGuard, getAuthenticatedUser } from '../auth/auth.guard';
import { MAX_DOCUMENT_SIZE_BYTES, MAX_FILES_PER_UPLOAD } from './document.constants';
import { DocumentsService } from './documents.service';

@Controller('v1')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('knowledge-bases/:knowledgeBaseId/documents')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES_PER_UPLOAD, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES, files: MAX_FILES_PER_UPLOAD },
    }),
  )
  upload(
    @Req() request: Request,
    @Param('knowledgeBaseId', new ParseUUIDPipe()) knowledgeBaseId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('At least one document is required');
    return this.documentsService.upload(getAuthenticatedUser(request).id, knowledgeBaseId, files);
  }

  @Get('knowledge-bases/:knowledgeBaseId/documents')
  findAll(
    @Req() request: Request,
    @Param('knowledgeBaseId', new ParseUUIDPipe()) knowledgeBaseId: string,
  ) {
    return this.documentsService.findAll(getAuthenticatedUser(request).id, knowledgeBaseId);
  }

  @Get('documents/:id/status')
  status(@Req() request: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.documentsService.findOne(getAuthenticatedUser(request).id, id);
  }

  @Delete('documents/:id')
  remove(@Req() request: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.documentsService.remove(getAuthenticatedUser(request).id, id);
  }
}
