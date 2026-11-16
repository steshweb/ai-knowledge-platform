import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { ChatDocumentsDto } from './dto/chat-documents.dto';
import { SearchDocumentsDto } from './dto/search-documents.dto';

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

  @Post('knowledge-bases/:knowledgeBaseId/search')
  @HttpCode(HttpStatus.OK)
  search(
    @Req() request: Request,
    @Param('knowledgeBaseId', new ParseUUIDPipe()) knowledgeBaseId: string,
    @Body() body: SearchDocumentsDto,
  ) {
    return this.documentsService.search(
      getAuthenticatedUser(request).id,
      knowledgeBaseId,
      body.query,
    );
  }

  @Post('knowledge-bases/:knowledgeBaseId/chat')
  @HttpCode(HttpStatus.OK)
  chat(
    @Req() request: Request,
    @Param('knowledgeBaseId', new ParseUUIDPipe()) knowledgeBaseId: string,
    @Body() body: ChatDocumentsDto,
  ) {
    return this.documentsService.chat(
      getAuthenticatedUser(request).id,
      knowledgeBaseId,
      body.message,
      body.conversationId,
    );
  }

  @Get('knowledge-bases/:knowledgeBaseId/conversations')
  conversations(
    @Req() request: Request,
    @Param('knowledgeBaseId', new ParseUUIDPipe()) knowledgeBaseId: string,
  ) {
    return this.documentsService.listConversations(
      getAuthenticatedUser(request).id,
      knowledgeBaseId,
    );
  }

  @Get('conversations/:id/messages')
  messages(@Req() request: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.documentsService.listMessages(getAuthenticatedUser(request).id, id);
  }

  @Delete('conversations/:id')
  removeConversation(@Req() request: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.documentsService.removeConversation(getAuthenticatedUser(request).id, id);
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
