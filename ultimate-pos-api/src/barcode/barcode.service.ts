import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBarcodeLabelDto } from './dto/create-barcode-label.dto';
import { UpdateBarcodeLabelDto } from './dto/update-barcode-label.dto';

@Injectable()
export class BarcodeService {
  constructor(private prisma: PrismaService) {}

  async findAllLabels(businessId: number) {
    return this.prisma.barcodeLabel.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
  }

  async findOneLabel(id: number, businessId: number) {
    const label = await this.prisma.barcodeLabel.findFirst({
      where: { id, businessId },
    });
    if (!label) throw new NotFoundException(`Barcode label #${id} not found`);
    return label;
  }

  async createLabel(businessId: number, dto: CreateBarcodeLabelDto) {
    return this.prisma.barcodeLabel.create({
      data: {
        businessId,
        name: dto.name,
        description: dto.description ?? null,
        stickerType: dto.stickerType ?? 'name_price',
        barcodeType: dto.barcodeType ?? 'C128',
        width: dto.width ?? null,
        height: dto.height ?? null,
        paperWidth: dto.paperWidth ?? null,
        paperHeight: dto.paperHeight ?? null,
        fontSize: dto.fontSize ?? null,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async updateLabel(id: number, businessId: number, dto: UpdateBarcodeLabelDto) {
    await this.findOneLabel(id, businessId);
    return this.prisma.barcodeLabel.update({
      where: { id },
      data: { ...dto },
    });
  }

  async removeLabel(id: number, businessId: number) {
    await this.findOneLabel(id, businessId);
    return this.prisma.barcodeLabel.delete({ where: { id } });
  }

  /**
   * Generate barcode data for a product/variation.
   * Returns the barcode string and metadata — actual SVG/PNG generation
   * is handled client-side (or via a library injected later).
   */
  async generateForProduct(businessId: number, productId: number, labelId?: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, businessId },
      select: {
        id: true,
        name: true,
        sku: true,
        variations: {
          select: { id: true, name: true, subSku: true },
        },
      },
    });
    if (!product) throw new NotFoundException(`Product #${productId} not found`);

    const label = labelId
      ? await this.findOneLabel(labelId, businessId)
      : await this.prisma.barcodeLabel.findFirst({
          where: { businessId, isDefault: true },
        });

    return {
      product: { id: product.id, name: product.name, sku: product.sku },
      label: label ?? null,
      barcodes: product.variations.map((v) => ({
        variationId: v.id,
        variationName: v.name,
        barcodeValue: v.subSku ?? product.sku,
      })),
    };
  }
}
