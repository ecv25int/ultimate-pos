import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type SupportedEntity = 'products' | 'contacts' | 'purchases';

@Injectable()
export class ImportExportService {
  constructor(private prisma: PrismaService) {}

  // ── Export ──────────────────────────────────────────────────────────────────

  async exportProducts(businessId: number) {
    const products = await this.prisma.product.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        sku: true,
        type: true,
        alertQuantity: true,
        enableStock: true,
        createdAt: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        unit: { select: { shortName: true } },
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      type: p.type,
      category: p.category?.name ?? '',
      brand: p.brand?.name ?? '',
      unit: p.unit?.shortName ?? '',
      alertQuantity: p.alertQuantity,
      enableStock: p.enableStock,
      createdAt: p.createdAt,
    }));
  }

  async exportContacts(businessId: number) {
    const contacts = await this.prisma.contact.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        type: true,
        city: true,
        state: true,
        country: true,
        createdAt: true,
      },
    });
    return contacts;
  }

  // ── Import preview / dry-run (accepts pre-parsed rows from controller) ──────

  async previewImport(
    businessId: number,
    entity: SupportedEntity,
    rows: Record<string, unknown>[],
  ) {
    // Validate and return enriched preview rows with status flags
    return rows.map((row, idx) => ({
      row: idx + 1,
      data: row,
      valid: this.validateRow(entity, row),
    }));
  }

  async commitImport(
    businessId: number,
    entity: SupportedEntity,
    rows: Record<string, unknown>[],
    userId: number,
  ) {
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const row of rows) {
      try {
        if (entity === 'products') {
          if (!row['name']) { results.skipped++; continue; }
          const firstUnit = await this.prisma.unit.findFirst({ where: { businessId } });
          if (!firstUnit) { results.skipped++; continue; }
          await this.prisma.product.create({
            data: {
              businessId,
              name: String(row['name']),
              sku: String(row['sku'] ?? `IMP-${Date.now()}`),
              type: 'single',
              unitId: firstUnit.id,
              createdBy: userId,
            },
          });
          results.created++;
        } else if (entity === 'contacts') {
          if (!row['name']) { results.skipped++; continue; }
          await this.prisma.contact.create({
            data: {
              businessId,
              name: String(row['name']),
              type: String(row['type'] ?? 'customer'),
              mobile: String(row['mobile'] ?? ''),
              createdBy: userId,
            },
          });
          results.created++;
        } else {
          results.skipped++;
        }
      } catch (err: unknown) {
        results.errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    return results;
  }

  // ── Column template for frontend CSV header guidance ─────────────────────

  getTemplate(entity: SupportedEntity) {
    const templates: Record<SupportedEntity, string[]> = {
      products: ['name', 'sku', 'type', 'category', 'brand', 'unit', 'alert_quantity', 'enable_stock'],
      contacts: ['name', 'email', 'mobile', 'type', 'contact_id', 'city', 'state', 'country'],
      purchases: ['supplier_name', 'invoice_no', 'date', 'product_sku', 'quantity', 'unit_price'],
    };
    return templates[entity] ?? [];
  }

  private validateRow(entity: SupportedEntity, row: Record<string, unknown>): boolean {
    if (entity === 'products') return Boolean(row['name']);
    if (entity === 'contacts') return Boolean(row['name']);
    if (entity === 'purchases') return Boolean(row['product_sku']);
    return true;
  }
}
