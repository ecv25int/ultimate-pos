import { Module } from '@nestjs/common';
import { VariationsService } from './variations.service';
import { VariationsController } from './variations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VariationsController],
  providers: [VariationsService],
  exports: [VariationsService],
})
export class VariationsModule {}
