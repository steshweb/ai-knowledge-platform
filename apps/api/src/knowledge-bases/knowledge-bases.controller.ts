import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, getAuthenticatedUser } from '../auth/auth.guard';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import { KnowledgeBasesService } from './knowledge-bases.service';

@Controller('v1/knowledge-bases')
@UseGuards(AuthGuard)
export class KnowledgeBasesController {
  constructor(private readonly knowledgeBasesService: KnowledgeBasesService) {}

  @Post()
  create(@Req() request: Request, @Body() dto: CreateKnowledgeBaseDto) {
    return this.knowledgeBasesService.create(getAuthenticatedUser(request).id, dto);
  }

  @Get()
  findAll(@Req() request: Request) {
    return this.knowledgeBasesService.findAll(getAuthenticatedUser(request).id);
  }

  @Get(':id')
  findOne(@Req() request: Request, @Param('id') id: string) {
    return this.knowledgeBasesService.findOne(getAuthenticatedUser(request).id, id);
  }

  @Patch(':id')
  update(@Req() request: Request, @Param('id') id: string, @Body() dto: UpdateKnowledgeBaseDto) {
    return this.knowledgeBasesService.update(getAuthenticatedUser(request).id, id, dto);
  }

  @Delete(':id')
  remove(@Req() request: Request, @Param('id') id: string) {
    return this.knowledgeBasesService.remove(getAuthenticatedUser(request).id, id);
  }
}
