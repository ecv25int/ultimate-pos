import { Module } from '@nestjs/common';
import { CustomerGroupsService } from './customer-groups.service';
import { CustomerGroupsController } from './customer-groups.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerGroupsController],
  providers: [CustomerGroupsService],
  exports: [CustomerGroupsService],
})
export class CustomerGroupsModule {}
