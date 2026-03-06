import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HmsService } from './hms.service';
import { HmsController } from './hms.controller';

@Module({ imports: [PrismaModule], providers: [HmsService], controllers: [HmsController] })
export class HmsModule {}
