import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EssentialsService } from './essentials.service';
import { EssentialsController } from './essentials.controller';

@Module({ imports: [PrismaModule], providers: [EssentialsService], controllers: [EssentialsController] })
export class EssentialsModule {}
