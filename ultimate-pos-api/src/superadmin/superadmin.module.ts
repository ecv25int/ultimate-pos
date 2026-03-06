import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SuperadminService } from './superadmin.service';
import { SuperadminController } from './superadmin.controller';

@Module({ imports: [PrismaModule], providers: [SuperadminService], controllers: [SuperadminController] })
export class SuperadminModule {}
