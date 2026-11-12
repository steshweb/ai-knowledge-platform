import { BadRequestException, Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { extname } from 'node:path';
import type { Express } from 'express';

@Injectable()
export class DocumentParserService {
  async extractText(file: Express.Multer.File): Promise<string> {
    const extension = extname(file.originalname).toLowerCase();

    try {
      if (extension === '.txt' || extension === '.md' || extension === '.markdown') {
        return file.buffer.toString('utf8');
      }

      if (extension === '.pdf') {
        const parser = new PDFParse({ data: file.buffer });
        try {
          const result = await parser.getText();
          return result.text;
        } finally {
          await parser.destroy();
        }
      }

      if (extension === '.docx') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value;
      }
    } catch {
      throw new BadRequestException(`Could not extract text from ${file.originalname}`);
    }

    throw new BadRequestException(`Unsupported document format: ${extension || 'unknown'}`);
  }
}
