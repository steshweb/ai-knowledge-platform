import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import type { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';

@Injectable()
export class KnowledgeBasesService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateKnowledgeBaseDto) {
    return this.prisma.knowledgeBase.create({
      data: {
        userId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.knowledgeBase.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const knowledgeBase = await this.prisma.knowledgeBase.findFirst({
      where: { id, userId },
    });
    if (!knowledgeBase) throw new NotFoundException('Knowledge base not found');
    return knowledgeBase;
  }

  async update(userId: string, id: string, dto: UpdateKnowledgeBaseDto) {
    await this.findOne(userId, id);
    return this.prisma.knowledgeBase.update({
      where: { id },
      data: {
        ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
        ...(dto.description === undefined ? {} : { description: dto.description?.trim() || null }),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.knowledgeBase.delete({ where: { id } });
    return { success: true };
  }
}
