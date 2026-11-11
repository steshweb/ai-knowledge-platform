import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { KnowledgeBasesModule } from './knowledge-bases/knowledge-bases.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, KnowledgeBasesModule, HealthModule],
})
export class AppModule {}
