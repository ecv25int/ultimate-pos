import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WoocommerceService } from './woocommerce.service';
import { WoocommerceController } from './woocommerce.controller';

@Module({ imports: [PrismaModule], providers: [WoocommerceService], controllers: [WoocommerceController] })
export class WoocommerceModule {}
