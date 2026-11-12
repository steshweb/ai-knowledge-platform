import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import type { Express } from 'express';
import { extname } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import {
  CHUNK_OVERLAP,
  CHUNK_SIZE,
  MAX_DOCUMENTS_PER_KNOWLEDGE_BASE,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_UPLOAD_SIZE_BYTES,
} from './document.constants';
import { splitTextIntoChunks } from './chunking';
import { DocumentParserService } from './document-parser.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: DocumentParserService,
  ) {}

  async upload(userId: string, knowledgeBaseId: string, files: Express.Multer.File[]) {
    await this.ensureKnowledgeBase(userId, knowledgeBaseId);

    const existingCount = await this.prisma.document.count({ where: { knowledgeBaseId } });
    if (existingCount + files.length > MAX_DOCUMENTS_PER_KNOWLEDGE_BASE) {
      throw new BadRequestException(
        `A knowledge base can contain up to ${MAX_DOCUMENTS_PER_KNOWLEDGE_BASE} documents`,
      );
    }

    for (const file of files) this.validateFile(file);
    if (files.reduce((total, file) => total + file.size, 0) > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('The total upload size must be 15 MB or smaller');
    }

    const documents = [];
    for (const file of files) {
      documents.push(await this.processFile(knowledgeBaseId, file));
    }
    return documents;
  }

  findAll(userId: string, knowledgeBaseId: string) {
    return this.ensureKnowledgeBase(userId, knowledgeBaseId).then(() =>
      this.prisma.document.findMany({
        where: { knowledgeBaseId },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { chunks: true } } },
      }),
    );
  }

  async findOne(userId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, knowledgeBase: { userId } },
      include: { _count: { select: { chunks: true } } },
    });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async remove(userId: string, documentId: string) {
    await this.findOne(userId, documentId);
    await this.prisma.document.delete({ where: { id: documentId } });
    return { success: true };
  }

  private async processFile(knowledgeBaseId: string, file: Express.Multer.File) {
    const document = await this.prisma.document.create({
      data: {
        knowledgeBaseId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        status: DocumentStatus.processing,
      },
    });

    try {
      const text = await this.parser.extractText(file);
      const chunks = splitTextIntoChunks(text, CHUNK_SIZE, CHUNK_OVERLAP);
      if (chunks.length === 0)
        throw new BadRequestException('The document contains no extractable text');

      const completedDocument = await this.prisma.$transaction(async (transaction) => {
        await transaction.documentChunk.createMany({
          data: chunks.map((content, chunkIndex) => ({
            documentId: document.id,
            content,
            chunkIndex,
          })),
        });
        return transaction.document.update({
          where: { id: document.id },
          data: { status: DocumentStatus.completed, errorMessage: null },
          include: { _count: { select: { chunks: true } } },
        });
      });

      return completedDocument;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Document processing failed';
      await this.prisma.document.update({
        where: { id: document.id },
        data: { status: DocumentStatus.failed, errorMessage: message },
      });
      throw error;
    }
  }

  private async ensureKnowledgeBase(userId: string, knowledgeBaseId: string) {
    const knowledgeBase = await this.prisma.knowledgeBase.findFirst({
      where: { id: knowledgeBaseId, userId },
    });
    if (!knowledgeBase) throw new NotFoundException('Knowledge base not found');
    return knowledgeBase;
  }

  private validateFile(file: Express.Multer.File) {
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new BadRequestException('Each document must be 5 MB or smaller');
    }

    const extension = extname(file.originalname).toLowerCase();
    const supportedExtensions = ['.txt', '.md', '.markdown', '.pdf', '.docx'];
    if (!supportedExtensions.includes(extension)) {
      throw new BadRequestException('Supported formats are TXT, Markdown, PDF, and DOCX');
    }

    if (extension === '.pdf' && !file.buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
      throw new BadRequestException('The uploaded PDF file is invalid');
    }
  }
}
