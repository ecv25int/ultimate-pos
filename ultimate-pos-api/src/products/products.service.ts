import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { parse as csvParse } from 'csv-parse/sync';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(userId: number, businessId: number, createProductDto: CreateProductDto) {
    // Verify unit exists and belongs to business
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: createProductDto.unitId,
        businessId,
        deletedAt: null,
      },
    });

    if (!unit) {
      throw new BadRequestException('Unit not found or does not belong to your business');
    }

    // Verify brand if provided
    if (createProductDto.brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: {
          id: createProductDto.brandId,
          businessId,
          deletedAt: null,
        },
      });

      if (!brand) {
        throw new BadRequestException('Brand not found or does not belong to your business');
      }
    }

    // Verify category if provided
    if (createProductDto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: createProductDto.categoryId,
          businessId,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new BadRequestException('Category not found or does not belong to your business');
      }
    }

    // Verify subcategory if provided
    if (createProductDto.subCategoryId) {
      const subCategory = await this.prisma.category.findFirst({
        where: {
          id: createProductDto.subCategoryId,
          businessId,
          deletedAt: null,
        },
      });

      if (!subCategory) {
        throw new BadRequestException('Sub-category not found or does not belong to your business');
      }
    }

    // Check if SKU already exists in the business
    const existingSku = await this.prisma.product.findFirst({
      where: {
        sku: createProductDto.sku,
        businessId,
      },
    });

    if (existingSku) {
      throw new BadRequestException('SKU already exists in your business');
    }

    const created = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        type: createProductDto.type || 'single',
        unitId: createProductDto.unitId,
        brandId: createProductDto.brandId,
        categoryId: createProductDto.categoryId,
        subCategoryId: createProductDto.subCategoryId,
        sku: createProductDto.sku,
        barcodeType: createProductDto.barcodeType || 'C128',
        enableStock: createProductDto.enableStock ?? false,
        alertQuantity: createProductDto.alertQuantity ?? 0,
        businessId,
        createdBy: userId,
      },
      include: {
        unit: {
          select: {
            id: true,
            actualName: true,
            shortName: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    await this.cacheManager.del(`products_${businessId}`);
    return created;
  }

  async findAll(businessId: number) {
    const cacheKey = `products_${businessId}`;
    const cached = await this.cacheManager.get<object[]>(cacheKey);
    if (cached) return cached;

    const result = await this.prisma.product.findMany({
      where: {
        businessId,
      },
      include: {
        unit: {
          select: {
            id: true,
            actualName: true,
            shortName: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    await this.cacheManager.set(cacheKey, result, 60_000); // 1 min
    return result;
  }

  /** Advanced search with optional filters */
  async search(
    businessId: number,
    opts: {
      query?: string;
      categoryId?: number;
      brandId?: number;
      type?: string;
      minPrice?: number;
      maxPrice?: number;
      stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { query, categoryId, brandId, type, stockStatus, page = 1, limit = 50 } = opts;
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where: any = { businessId };
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { sku: { contains: query } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (type) where.type = type;

    const include = {
      unit: { select: { id: true, shortName: true } },
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({ where, include, orderBy: { name: 'asc' }, skip, take: safeLimit }),
      this.prisma.product.count({ where }),
    ]);

    // Optionally filter by stock status using StockEntry aggregations
    if (stockStatus) {
      const stockAgg = await this.prisma.stockEntry.groupBy({
        by: ['productId'],
        where: { businessId },
        _sum: { quantity: true },
      });
      const stockMap = new Map(stockAgg.map((s) => [s.productId, Number(s._sum.quantity ?? 0)]));

      const filtered = products.filter((p) => {
        const qty = stockMap.get(p.id) ?? 0;
        const alert = Number(p.alertQuantity ?? 5);
        if (stockStatus === 'out_of_stock') return qty <= 0;
        if (stockStatus === 'low_stock') return qty > 0 && qty <= alert;
        return qty > alert; // in_stock
      });
      return { products: filtered, total: filtered.length, page, limit: safeLimit };
    }

    return { products, total, page, limit: safeLimit };
  }

  /** Bulk update default sell price for a set of variations */
  async bulkUpdatePrices(
    businessId: number,
    updates: { variationId: number; defaultSellPrice: number }[],
  ) {
    const results: { id: number; updated: boolean }[] = [];
    await Promise.all(
      updates.map(async ({ variationId, defaultSellPrice }) => {
        if (defaultSellPrice < 0) { results.push({ id: variationId, updated: false }); return; }
        // Verify the variation belongs to a product of this business
        const variation = await this.prisma.variation.findFirst({
          where: { id: variationId, product: { businessId } },
        });
        if (!variation) { results.push({ id: variationId, updated: false }); return; }
        await this.prisma.variation.update({
          where: { id: variationId },
          data: { defaultSellPrice },
        });
        results.push({ id: variationId, updated: true });
      }),
    );
    // Invalidate cache
    await this.cacheManager.del(`products_${businessId}`);
    return { updated: results.filter((r) => r.updated).length, results };
  }

  async findOne(id: number, businessId: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        unit: {
          select: {
            id: true,
            actualName: true,
            shortName: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: number, businessId: number, updateProductDto: UpdateProductDto) {
    // Verify product exists and belongs to the user's business
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        businessId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify unit if being updated
    if (updateProductDto.unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: {
          id: updateProductDto.unitId,
          businessId,
          deletedAt: null,
        },
      });

      if (!unit) {
        throw new BadRequestException('Unit not found');
      }
    }

    // Verify brand if being updated
    if (updateProductDto.brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: {
          id: updateProductDto.brandId,
          businessId,
          deletedAt: null,
        },
      });

      if (!brand) {
        throw new BadRequestException('Brand not found');
      }
    }

    // Verify category if being updated
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: updateProductDto.categoryId,
          businessId,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    // Verify subcategory if being updated
    if (updateProductDto.subCategoryId) {
      const subCategory = await this.prisma.category.findFirst({
        where: {
          id: updateProductDto.subCategoryId,
          businessId,
          deletedAt: null,
        },
      });

      if (!subCategory) {
        throw new BadRequestException('Sub-category not found');
      }
    }

    // Check if SKU is being updated and already exists
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingSku = await this.prisma.product.findFirst({
        where: {
          sku: updateProductDto.sku,
          businessId,
          id: { not: id },
        },
      });

      if (existingSku) {
        throw new BadRequestException('SKU already exists in your business');
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: updateProductDto.name,
        type: updateProductDto.type,
        unitId: updateProductDto.unitId,
        brandId: updateProductDto.brandId,
        categoryId: updateProductDto.categoryId,
        subCategoryId: updateProductDto.subCategoryId,
        sku: updateProductDto.sku,
        barcodeType: updateProductDto.barcodeType,
        enableStock: updateProductDto.enableStock,
        alertQuantity: updateProductDto.alertQuantity,
      },
      include: {
        unit: {
          select: {
            id: true,
            actualName: true,
            shortName: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    await this.cacheManager.del(`products_${businessId}`);
    return updated;
  }

  async remove(id: number, businessId: number) {
    // Verify product exists and belongs to the user's business
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        businessId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Hard delete (products don't have soft delete in the schema)
    await this.prisma.product.delete({
      where: { id },
    });

    await this.cacheManager.del(`products_${businessId}`);
    return { message: 'Product deleted successfully' };
  }

  /**
   * Export all products for a business as CSV string
   */
  async exportToCsv(businessId: number): Promise<string> {
    const products = await this.prisma.product.findMany({
      where: { businessId },
      include: {
        unit: { select: { id: true, actualName: true } },
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const headers = [
      'id', 'name', 'sku', 'type', 'barcode_type',
      'unit_id', 'unit_name',
      'brand_id', 'brand_name',
      'category_id', 'category_name',
      'enable_stock', 'alert_quantity',
    ];

    const escape = (v: unknown) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const rows = products.map((p) => [
      p.id, p.name, p.sku, p.type, p.barcodeType,
      p.unit?.id ?? '', p.unit?.actualName ?? '',
      p.brand?.id ?? '', p.brand?.name ?? '',
      p.category?.id ?? '', p.category?.name ?? '',
      p.enableStock ? 'true' : 'false',
      Number(p.alertQuantity),
    ].map(escape).join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Import products from a CSV buffer
   * Required columns: name, sku, unit_id
   * Optional: brand_id, category_id, barcode_type, enable_stock, alert_quantity
   */
  async importFromCsv(
    userId: number,
    businessId: number,
    csvBuffer: Buffer,
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    let records: Record<string, string>[];
    try {
      records = csvParse(csvBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (e) {
      throw new BadRequestException('Invalid CSV file: ' + e.message);
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // 1-based + header row

      if (!row.name || !row.sku || !row.unit_id) {
        errors.push(`Row ${rowNum}: name, sku, and unit_id are required`);
        skipped++;
        continue;
      }

      // Check for duplicate SKU within this business
      const existing = await this.prisma.product.findFirst({
        where: { sku: row.sku, businessId },
      });
      if (existing) {
        errors.push(`Row ${rowNum}: SKU "${row.sku}" already exists — skipped`);
        skipped++;
        continue;
      }

      // Validate unit
      const unit = await this.prisma.unit.findFirst({
        where: { id: Number(row.unit_id), businessId, deletedAt: null },
      });
      if (!unit) {
        errors.push(`Row ${rowNum}: unit_id ${row.unit_id} not found — skipped`);
        skipped++;
        continue;
      }

      try {
        await this.prisma.product.create({
          data: {
            name: row.name,
            sku: row.sku,
            type: 'single',
            businessId,
            createdBy: userId,
            unitId: Number(row.unit_id),
            brandId: row.brand_id ? Number(row.brand_id) : null,
            categoryId: row.category_id ? Number(row.category_id) : null,
            barcodeType: row.barcode_type || 'C128',
            enableStock: row.enable_stock === 'true',
            alertQuantity: Number(row.alert_quantity) || 0,
          },
        });
        created++;
      } catch (e) {
        errors.push(`Row ${rowNum}: failed to create — ${e.message}`);
        skipped++;
      }
    }

    return { created, skipped, errors };
  }

  /** Upload or replace a product image. `filename` is the saved disk filename. */
  async uploadImage(id: number, businessId: number, filename: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId },
    });
    if (!product) {
      // Remove the just-uploaded file so it doesn't orphan
      const orphan = join(process.cwd(), 'public', 'uploads', 'products', filename);
      if (existsSync(orphan)) unlinkSync(orphan);
      throw new NotFoundException('Product not found');
    }

    // Delete old image file if it existed
    if (product.imageUrl) {
      const oldFile = join(
        process.cwd(),
        'public',
        product.imageUrl.replace(/^\/static\//, ''),
      );
      if (existsSync(oldFile)) unlinkSync(oldFile);
    }

    const imageUrl = `/static/uploads/products/${filename}`;
    const updated = await this.prisma.product.update({
      where: { id },
      data: { imageUrl },
    });
    await this.cacheManager.del(`products_${businessId}`);
    return updated;
  }

  /** Remove a product's image. */
  async removeImage(id: number, businessId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.imageUrl) return { message: 'No image to remove' };

    const filePath = join(
      process.cwd(),
      'public',
      product.imageUrl.replace(/^\/static\//, ''),
    );
    if (existsSync(filePath)) unlinkSync(filePath);

    await this.prisma.product.update({
      where: { id },
      data: { imageUrl: null },
    });
    await this.cacheManager.del(`products_${businessId}`);
    return { message: 'Image removed' };
  }
}
