import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

@Module({ imports: [PrismaModule], providers: [ProjectService], controllers: [ProjectController] })
export class ProjectModule {}
