/**
 * migrate-legacy-data.ts
 *
 * Skeleton script for migrating data from the legacy Laravel/MySQL Ultimate POS
 * database to the new NestJS + Prisma schema.
 *
 * Usage:
 *   ts-node scripts/migrate-legacy-data.ts
 *
 * Prerequisites:
 *   1. Both databases must be reachable.
 *   2. Set environment variables (see below) or copy .env.migration.example.
 *   3. Run `npx prisma generate` in ultimate-pos-api/ first.
 *
 * Environment variables:
 *   LEGACY_DB_URL   — MySQL DSN for old Laravel DB  (e.g. mysql://user:pass@host/ultimate_pos)
 *   NEW_DB_URL      — MySQL DSN for new Prisma DB   (e.g. mysql://user:pass@host/ultimate_pos_new)
 */

import mysql, { RowDataPacket } from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';

// ── Config ────────────────────────────────────────────────────────────────────

const LEGACY_DB_URL = process.env['LEGACY_DB_URL'] ?? 'mysql://root:@127.0.0.1/ultimate_pos';
const BATCH_SIZE = 200;

let legacyConn: mysql.Connection;
const prisma = new PrismaClient({ datasources: { db: { url: process.env['NEW_DB_URL'] } } });

// ── Helpers ───────────────────────────────────────────────────────────────────

async function query<T extends RowDataPacket>(sql: string, params?: unknown[]): Promise<T[]> {
  const [rows] = await legacyConn.query<T[]>(sql, params);
  return rows;
}

function toDate(val: unknown): Date | null {
  if (!val) return null;
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}

// ── Migration steps ───────────────────────────────────────────────────────────

/**
 * Step 1 — Migrate businesses.
 * Legacy table: `business`
 * New model:    Business
 *
 * Field mapping:
 *   id               → id
 *   name             → name
 *   email            → email
 *   phone_number     → phone
 *   mobile_number    → (ignored / merged into phone if blank)
 *   currency_id      → (resolve currency code from `currencies` table)
 *   country          → country
 *   state            → state
 *   city             → city
 *   default_profit_percent → defaultProfitPercent
 *   created_at       → createdAt
 */
async function migrateBusinesses(): Promise<void> {
  console.log('[1/9] Migrating businesses…');
  const rows = await query<RowDataPacket>('SELECT * FROM business');

  for (const row of rows) {
    await prisma.business.upsert({
      where: { id: row['id'] },
      create: {
        id: row['id'],
        name: row['name'],
        email: row['email'] ?? null,
        phone: row['phone_number'] ?? row['mobile_number'] ?? null,
        country: row['country'] ?? null,
        state: row['state'] ?? null,
        city: row['city'] ?? null,
        createdAt: toDate(row['created_at']) ?? new Date(),
      },
      update: {},
    });
  }
  console.log(`    ✓ ${rows.length} businesses`);
}

/**
 * Step 2 — Migrate users.
 * Legacy table: `users`
 * New model:    User
 *
 * Field mapping:
 *   id                → id
 *   first_name        → firstName
 *   last_name         → lastName
 *   username          → username
 *   email             → email
 *   password          → password  (already bcrypt-hashed)
 *   contact_id        → (ignored — contacts migrated separately)
 *   business_id       → businessId
 *   user_type         → role  ('admin' | 'cashier' → 'manager')
 *   created_at        → createdAt
 */
async function migrateUsers(): Promise<void> {
  console.log('[2/9] Migrating users…');
  const rows = await query<RowDataPacket>('SELECT * FROM users');

  for (const row of rows) {
    const role: string =
      row['user_type'] === 'superadmin' ? 'admin' :
      row['user_type'] === 'admin' ? 'admin' :
      'manager';

    await prisma.user.upsert({
      where: { id: row['id'] },
      create: {
        id: row['id'],
        username: row['username'] ?? row['email'],
        email: row['email'],
        password: row['password'],
        firstName: row['first_name'] ?? null,
        lastName: row['last_name'] ?? null,
        role,
        businessId: row['business_id'] ?? null,
        createdAt: toDate(row['created_at']) ?? new Date(),
      },
      update: {},
    });
  }
  console.log(`    ✓ ${rows.length} users`);
}

/**
 * Step 3 — Migrate contacts (customers + suppliers).
 * Legacy table: `contacts`
 * New model:    Contact
 *
 * Field mapping:
 *   id               → id
 *   type             → type  ('customer' | 'supplier' | 'both')
 *   name             → name
 *   email            → email
 *   mobile           → mobile
 *   landline         → phone
 *   address_line_1   → addressLine1
 *   city             → city
 *   state            → state
 *   country          → country
 *   business_id      → businessId
 *   created_at       → createdAt
 */
async function migrateContacts(): Promise<void> {
  console.log('[3/9] Migrating contacts…');
  let offset = 0;
  let total = 0;

  while (true) {
    const batch = await query<RowDataPacket>(
      'SELECT * FROM contacts LIMIT ? OFFSET ?',
      [BATCH_SIZE, offset],
    );
    if (batch.length === 0) break;

    for (const row of batch) {
      await prisma.contact.upsert({
        where: { id: row['id'] },
        create: {
          id: row['id'],
          type: row['type'] ?? 'customer',
          name: row['name'],
          email: row['email'] ?? null,
          mobile: row['mobile'] ?? null,
          phone: row['landline'] ?? null,
          addressLine1: row['address_line_1'] ?? null,
          city: row['city'] ?? null,
          state: row['state'] ?? null,
          country: row['country'] ?? null,
          businessId: row['business_id'],
          createdAt: toDate(row['created_at']) ?? new Date(),
        },
        update: {},
      });
    }

    total += batch.length;
    offset += BATCH_SIZE;
    process.stdout.write(`\r    ${total} contacts…`);
  }
  console.log(`\n    ✓ ${total} contacts`);
}

/**
 * Step 4 — Migrate products.
 * Legacy table: `products`
 * New model:    Product
 *
 * Field mapping:
 *   id                  → id
 *   name                → name
 *   sku                 → sku
 *   type                → type  ('single' | 'variable' | 'combo')
 *   unit_id             → unitId
 *   category_id         → categoryId
 *   tax                 → taxRateId  (resolve from tax_rates by rate)
 *   purchase_price      → purchasePrice
 *   sell_price          → sellingPrice
 *   alert_quantity      → alertQuantity
 *   enable_stock        → enableStock
 *   business_id         → businessId
 *   description         → description
 *   created_at          → createdAt
 */
async function migrateProducts(): Promise<void> {
  console.log('[4/9] Migrating products…');
  let offset = 0;
  let total = 0;

  while (true) {
    const batch = await query<RowDataPacket>(
      'SELECT * FROM products LIMIT ? OFFSET ?',
      [BATCH_SIZE, offset],
    );
    if (batch.length === 0) break;

    for (const row of batch) {
      await prisma.product.upsert({
        where: { id: row['id'] },
        create: {
          id: row['id'],
          name: row['name'],
          sku: row['sku'] ?? `SKU-${row['id']}`,
          type: row['type'] ?? 'single',
          unitId: row['unit_id'] ?? null,
          categoryId: row['category_id'] ?? null,
          purchasePrice: parseFloat(row['purchase_price']) || 0,
          sellingPrice: parseFloat(row['sell_price']) || 0,
          alertQuantity: parseFloat(row['alert_quantity']) || 0,
          enableStock: row['enable_stock'] === 1,
          description: row['description'] ?? null,
          businessId: row['business_id'],
          createdAt: toDate(row['created_at']) ?? new Date(),
        },
        update: {},
      });
    }

    total += batch.length;
    offset += BATCH_SIZE;
    process.stdout.write(`\r    ${total} products…`);
  }
  console.log(`\n    ✓ ${total} products`);
}

/**
 * Step 5 — Migrate sales (transactions of type 'sell').
 * Legacy table: `transactions` WHERE type IN ('sell', 'sell_return')
 * New model:    Sale
 *
 * Field mapping:
 *   id                   → id
 *   contact_id           → contactId
 *   business_id          → businessId
 *   invoice_no           → invoiceNo
 *   status               → status
 *   payment_status       → paymentStatus
 *   final_total          → finalTotal
 *   total_before_tax     → subtotal
 *   discount_amount      → discountAmount
 *   tax_amount           → taxAmount
 *   shipping_charges     → shippingAmount
 *   transaction_date     → transactionDate
 *   additional_notes     → note
 *   created_at           → createdAt
 */
async function migrateSales(): Promise<void> {
  console.log('[5/9] Migrating sales…');
  let offset = 0;
  let total = 0;

  while (true) {
    const batch = await query<RowDataPacket>(
      "SELECT * FROM transactions WHERE type IN ('sell','sell_return') LIMIT ? OFFSET ?",
      [BATCH_SIZE, offset],
    );
    if (batch.length === 0) break;

    for (const row of batch) {
      await prisma.sale.upsert({
        where: { id: row['id'] },
        create: {
          id: row['id'],
          invoiceNo: row['invoice_no'] ?? null,
          contactId: row['contact_id'] ?? null,
          businessId: row['business_id'],
          status: row['status'] ?? 'final',
          paymentStatus: row['payment_status'] ?? 'due',
          subtotal: parseFloat(row['total_before_tax']) || 0,
          discountAmount: parseFloat(row['discount_amount']) || 0,
          taxAmount: parseFloat(row['tax_amount']) || 0,
          shippingAmount: parseFloat(row['shipping_charges']) || 0,
          finalTotal: parseFloat(row['final_total']) || 0,
          paidAmount: parseFloat(row['total_paid'] ?? '0') || 0,
          note: row['additional_notes'] ?? null,
          transactionDate: toDate(row['transaction_date']) ?? new Date(),
          createdAt: toDate(row['created_at']) ?? new Date(),
        },
        update: {},
      });
    }

    total += batch.length;
    offset += BATCH_SIZE;
    process.stdout.write(`\r    ${total} sales…`);
  }
  console.log(`\n    ✓ ${total} sales`);
}

/**
 * Step 6 — Migrate purchases (transactions of type 'purchase').
 * Legacy table: `transactions` WHERE type IN ('purchase', 'purchase_return')
 * New model:    Purchase
 *
 * Field mapping:
 *   id                   → id
 *   contact_id           → contactId
 *   business_id          → businessId
 *   ref_no               → refNo
 *   status               → status
 *   payment_status       → paymentStatus
 *   final_total          → finalTotal
 *   total_before_tax     → subtotal
 *   discount_amount      → discountAmount
 *   tax_amount           → taxAmount
 *   shipping_charges     → shippingAmount
 *   transaction_date     → purchaseDate
 *   additional_notes     → note
 *   created_at           → createdAt
 */
async function migratePurchases(): Promise<void> {
  console.log('[6/9] Migrating purchases…');
  let offset = 0;
  let total = 0;

  while (true) {
    const batch = await query<RowDataPacket>(
      "SELECT * FROM transactions WHERE type IN ('purchase','purchase_return') LIMIT ? OFFSET ?",
      [BATCH_SIZE, offset],
    );
    if (batch.length === 0) break;

    for (const row of batch) {
      await prisma.purchase.upsert({
        where: { id: row['id'] },
        create: {
          id: row['id'],
          refNo: row['ref_no'] ?? null,
          contactId: row['contact_id'] ?? null,
          businessId: row['business_id'],
          status: row['status'] ?? 'received',
          paymentStatus: row['payment_status'] ?? 'due',
          subtotal: parseFloat(row['total_before_tax']) || 0,
          discountAmount: parseFloat(row['discount_amount']) || 0,
          taxAmount: parseFloat(row['tax_amount']) || 0,
          shippingAmount: parseFloat(row['shipping_charges']) || 0,
          finalTotal: parseFloat(row['final_total']) || 0,
          paidAmount: parseFloat(row['total_paid'] ?? '0') || 0,
          note: row['additional_notes'] ?? null,
          purchaseDate: toDate(row['transaction_date']) ?? new Date(),
          createdAt: toDate(row['created_at']) ?? new Date(),
        },
        update: {},
      });
    }

    total += batch.length;
    offset += BATCH_SIZE;
    process.stdout.write(`\r    ${total} purchases…`);
  }
  console.log(`\n    ✓ ${total} purchases`);
}

/**
 * Step 7 — Migrate payments.
 * Legacy table: `transaction_payments`
 * New model:    Payment
 *
 * Field mapping:
 *   id                    → id
 *   transaction_id        → saleId (if transaction.type = 'sell'/'sell_return') OR
 *                           purchaseId (if transaction.type = 'purchase'/'purchase_return')
 *   business_id           → businessId  (resolved from parent transaction)
 *   amount                → amount
 *   method                → method  ('cheque'→'check'; custom_pay_*→'other')
 *   ref_no / card_transaction_number → referenceNo
 *   note                  → note
 *   paid_on               → paymentDate
 *   created_by            → createdBy
 *   created_at            → createdAt
 */
async function migratePayments(): Promise<void> {
  console.log('[7/9] Migrating payments…');
  let offset = 0;
  let total = 0;

  while (true) {
    const batch = await query<RowDataPacket>(
      `SELECT tp.*, t.type AS tx_type, t.business_id, t.created_by AS tx_created_by
       FROM transaction_payments tp
       JOIN transactions t ON t.id = tp.transaction_id
       WHERE t.type IN ('sell','sell_return','purchase','purchase_return')
       LIMIT ? OFFSET ?`,
      [BATCH_SIZE, offset],
    );
    if (batch.length === 0) break;

    for (const row of batch) {
      const isSale = row['tx_type'] === 'sell' || row['tx_type'] === 'sell_return';

      // Normalise legacy method values → new schema values
      const rawMethod: string = (row['method'] ?? 'cash').toLowerCase();
      const methodMap: Record<string, string> = {
        cash: 'cash',
        card: 'card',
        cheque: 'check',
        bank_transfer: 'bank_transfer',
        custom_pay_1: 'other',
        custom_pay_2: 'other',
        custom_pay_3: 'other',
        other: 'other',
      };
      const method = methodMap[rawMethod] ?? 'other';

      const referenceNo: string | null =
        row['ref_no'] ?? row['card_transaction_number'] ?? null;

      const createdBy: number =
        row['created_by'] ?? row['tx_created_by'] ?? 1;

      await prisma.payment.upsert({
        where: { id: row['id'] },
        create: {
          id: row['id'],
          businessId: row['business_id'],
          saleId: isSale ? row['transaction_id'] : null,
          purchaseId: isSale ? null : row['transaction_id'],
          amount: parseFloat(row['amount']) || 0,
          method,
          referenceNo,
          note: row['note'] ?? null,
          paymentDate: toDate(row['paid_on']) ?? toDate(row['created_at']) ?? new Date(),
          createdBy,
          createdAt: toDate(row['created_at']) ?? new Date(),
        },
        update: {},
      });
    }

    total += batch.length;
    offset += BATCH_SIZE;
    process.stdout.write(`\r    ${total} payments…`);
  }
  console.log(`\n    ✓ ${total} payments`);
}

/**
 * Step 8 — Migrate stock adjustments.
 * Legacy table: `transactions` WHERE type = 'stock_adjustment'
 *              + `stock_adjustment_lines` (child rows)
 * New models:   StockAdjustment + StockAdjustmentLine
 *
 * Field mapping (StockAdjustment):
 *   transactions.id                → id
 *   transactions.business_id       → businessId
 *   transactions.location_id       → locationId
 *   transactions.ref_no            → referenceNo
 *   transactions.adjustment_type   → adjustmentType  ('normal'|'abnormal')
 *   transactions.total_amount_recovered → totalAmount
 *   transactions.additional_notes  → note
 *   transactions.status            → status
 *   transactions.created_by        → createdBy
 *   transactions.created_at        → createdAt
 *
 * Field mapping (StockAdjustmentLine):
 *   stock_adjustment_lines.id           → id
 *   stock_adjustment_lines.transaction_id → adjustmentId
 *   stock_adjustment_lines.variation_id → variationId
 *   stock_adjustment_lines.quantity     → quantity
 *   stock_adjustment_lines.unit_price   → unitPrice
 */
async function migrateStockAdjustments(): Promise<void> {
  console.log('[8/9] Migrating stock adjustments…');
  let offset = 0;
  let totalHeaders = 0;
  let totalLines = 0;

  while (true) {
    const batch = await query<RowDataPacket>(
      `SELECT * FROM transactions WHERE type = 'stock_adjustment' LIMIT ? OFFSET ?`,
      [BATCH_SIZE, offset],
    );
    if (batch.length === 0) break;

    for (const row of batch) {
      // Upsert the header
      await prisma.stockAdjustment.upsert({
        where: { id: row['id'] },
        create: {
          id: row['id'],
          businessId: row['business_id'],
          locationId: row['location_id'] ?? null,
          referenceNo: row['ref_no'] ?? null,
          adjustmentType: row['adjustment_type'] ?? 'normal',
          totalAmount: parseFloat(row['total_amount_recovered'] ?? '0') || 0,
          note: row['additional_notes'] ?? null,
          status: row['status'] ?? 'received',
          finalised: row['status'] === 'received',
          finalisedAt: row['status'] === 'received'
            ? (toDate(row['updated_at']) ?? new Date())
            : null,
          createdBy: row['created_by'] ?? 1,
          createdAt: toDate(row['created_at']) ?? new Date(),
        },
        update: {},
      });

      // Upsert the lines for this adjustment
      const lines = await query<RowDataPacket>(
        'SELECT * FROM stock_adjustment_lines WHERE transaction_id = ?',
        [row['id']],
      );
      for (const line of lines) {
        await prisma.stockAdjustmentLine.upsert({
          where: { id: line['id'] },
          create: {
            id: line['id'],
            adjustmentId: row['id'],
            variationId: line['variation_id'] ?? null,
            quantity: parseFloat(line['quantity']) || 0,
            unitPrice: parseFloat(line['unit_price'] ?? '0') || 0,
          },
          update: {},
        });
        totalLines++;
      }
      totalHeaders++;
    }

    offset += BATCH_SIZE;
    process.stdout.write(`\r    ${totalHeaders} adjustments, ${totalLines} lines…`);
  }
  console.log(`\n    ✓ ${totalHeaders} adjustments, ${totalLines} lines`);
}

/**
 * Step 9 — Migrate sale lines.
 * Legacy table: `transaction_sell_lines`
 * New model:    SaleLine
 *
 * Field mapping:
 *   id                       → id
 *   transaction_id           → saleId
 *   product_id               → productId
 *   variation_id             → variationId (nullable)
 *   quantity                 → quantity
 *   unit_price               → unitPrice  (sell_price_inc_tax / quantity, or
 *                                          unit_price_before_discount)
 *   discount_amount          → discountAmount
 *   item_tax                 → taxAmount
 *   line_total               → lineTotal  (= quantity × unit_price − discount)
 */
async function migrateSaleLines(): Promise<void> {
  console.log('[9/11] Migrating sale lines…');

  // Only migrate lines whose parent sale was successfully migrated
  const saleIds = await query<RowDataPacket>(
    "SELECT id FROM transactions WHERE type IN ('sell','sell_return')",
  );
  if (saleIds.length === 0) {
    console.log('    ⚠ No sales found — skipping sale lines');
    return;
  }

  let offset = 0;
  let total = 0;

  while (true) {
    const batch = await query<RowDataPacket>(
      `SELECT tsl.*
       FROM transaction_sell_lines tsl
       INNER JOIN transactions t ON t.id = tsl.transaction_id
       WHERE t.type IN ('sell','sell_return')
       LIMIT ? OFFSET ?`,
      [BATCH_SIZE, offset],
    );
    if (batch.length === 0) break;

    for (const row of batch) {
      const qty = parseFloat(row['quantity']) || 0;
      const unitPrice = parseFloat(row['unit_price_before_discount'] ?? row['sell_price_inc_tax'] ?? '0') || 0;
      const discountAmount = parseFloat(row['discount_amount'] ?? '0') || 0;
      const taxAmount = parseFloat(row['item_tax'] ?? '0') || 0;
      const lineTotal = qty * unitPrice - discountAmount;

      await prisma.saleLine.upsert({
        where: { id: row['id'] },
        create: {
          id: row['id'],
          saleId: row['transaction_id'],
          productId: row['product_id'],
          variationId: row['variation_id'] ?? null,
          quantity: qty,
          unitPrice,
          discountAmount,
          taxAmount,
          lineTotal: parseFloat(row['line_total'] ?? String(lineTotal)) || lineTotal,
          note: row['lot_no_line_id'] ? null : null, // no note field in legacy
          createdAt: toDate(row['created_at']) ?? new Date(),
        },
        update: {},
      });
    }

    total += batch.length;
    offset += BATCH_SIZE;
    process.stdout.write(`\r    ${total} sale lines…`);
  }
  console.log(`\n    ✓ ${total} sale lines`);
}

/**
 * Step 10 — Migrate purchase lines.
 * Legacy table: `purchase_lines`
 * New model:    PurchaseLine
 *
 * Field mapping:
 *   id                   → id
 *   transaction_id       → purchaseId
 *   product_id           → productId
 *   quantity             → quantity
 *   purchase_price       → unitCostBefore  (price before any adjustment)
 *   pp_without_discount  → unitCostBefore  (preferred if present)
 *   purchase_price_total → lineTotal
 *   item_tax             → taxAmount
 *   tax_percent_in_transaction → (ignored — taxAmount already computed)
 *   discount_amount      → discountAmount
 */
async function migratePurchaseLines(): Promise<void> {
  console.log('[10/11] Migrating purchase lines…');

  let offset = 0;
  let total = 0;

  while (true) {
    const batch = await query<RowDataPacket>(
      `SELECT pl.*
       FROM purchase_lines pl
       INNER JOIN transactions t ON t.id = pl.transaction_id
       WHERE t.type IN ('purchase','purchase_return')
       LIMIT ? OFFSET ?`,
      [BATCH_SIZE, offset],
    );
    if (batch.length === 0) break;

    for (const row of batch) {
      const qty = parseFloat(row['quantity']) || 0;
      const unitCostBefore = parseFloat(row['pp_without_discount'] ?? row['purchase_price'] ?? '0') || 0;
      const unitCostAfter = parseFloat(row['purchase_price'] ?? '0') || 0;
      const discountAmount = parseFloat(row['discount_amount'] ?? '0') || 0;
      const taxAmount = parseFloat(row['item_tax'] ?? '0') || 0;
      const lineTotal = parseFloat(row['purchase_price_total'] ?? String(qty * unitCostAfter)) || 0;

      await prisma.purchaseLine.upsert({
        where: { id: row['id'] },
        create: {
          id: row['id'],
          purchaseId: row['transaction_id'],
          productId: row['product_id'],
          quantity: qty,
          unitCostBefore,
          unitCostAfter,
          discountAmount,
          taxAmount,
          lineTotal,
          note: null,
          createdAt: toDate(row['created_at']) ?? new Date(),
        },
        update: {},
      });
    }

    total += batch.length;
    offset += BATCH_SIZE;
    process.stdout.write(`\r    ${total} purchase lines…`);
  }
  console.log(`\n    ✓ ${total} purchase lines`);
}

/**
 * Step 11 — Build inventory (StockEntry) from migrated purchase + sale lines.
 *
 * Strategy: derive current stock from the migrated transactional records:
 *   • purchase_lines  → StockEntry type='purchase_in'  (qty = positive)
 *   • transaction_sell_lines → StockEntry type='sale_out' (qty = negative)
 *   • purchase_return lines  → StockEntry type='adjustment_out' (qty = negative)
 *   • sell_return lines      → StockEntry type='sale_return' (qty = positive)
 *
 * We resolve businessId from the parent transaction.
 * productId is taken directly from the line; variationId is used to resolve
 * productId when the legacy row only has variation_id.
 */
async function migrateInventory(): Promise<void> {
  console.log('[11/11] Migrating inventory (StockEntry) from purchase + sale lines…');

  let total = 0;

  // ── Purchase lines → stock in ─────────────────────────────────────────────
  let offset = 0;
  while (true) {
    const batch = await query<RowDataPacket>(
      `SELECT pl.id, pl.transaction_id, pl.product_id, pl.quantity, pl.purchase_price,
              t.business_id, t.type AS tx_type, t.ref_no, t.created_by, t.created_at
       FROM purchase_lines pl
       INNER JOIN transactions t ON t.id = pl.transaction_id
       WHERE t.type IN ('purchase','purchase_return')
       LIMIT ? OFFSET ?`,
      [BATCH_SIZE, offset],
    );
    if (batch.length === 0) break;

    for (const row of batch) {
      const isPurchaseReturn = row['tx_type'] === 'purchase_return';
      const qty = parseFloat(row['quantity']) || 0;

      await prisma.stockEntry.create({
        data: {
          businessId: row['business_id'],
          productId: row['product_id'],
          entryType: isPurchaseReturn ? 'adjustment_out' : 'purchase_in',
          quantity: isPurchaseReturn ? -qty : qty,
          unitCost: parseFloat(row['purchase_price'] ?? '0') || null,
          referenceNo: row['ref_no'] ?? null,
          note: `Migrated from legacy purchase_line id=${row['id']}`,
          createdBy: row['created_by'] ?? 1,
          createdAt: toDate(row['created_at']) ?? new Date(),
        },
      });
      total++;
    }

    offset += BATCH_SIZE;
    process.stdout.write(`\r    ${total} stock entries (purchases)…`);
  }

  // ── Sale lines → stock out ────────────────────────────────────────────────
  offset = 0;
  while (true) {
    const batch = await query<RowDataPacket>(
      `SELECT tsl.id, tsl.transaction_id, tsl.product_id, tsl.quantity,
              tsl.unit_price_before_discount AS unit_price,
              t.business_id, t.type AS tx_type, t.invoice_no, t.created_by, t.created_at
       FROM transaction_sell_lines tsl
       INNER JOIN transactions t ON t.id = tsl.transaction_id
       WHERE t.type IN ('sell','sell_return')
       LIMIT ? OFFSET ?`,
      [BATCH_SIZE, offset],
    );
    if (batch.length === 0) break;

    for (const row of batch) {
      const isSellReturn = row['tx_type'] === 'sell_return';
      const qty = parseFloat(row['quantity']) || 0;

      await prisma.stockEntry.create({
        data: {
          businessId: row['business_id'],
          productId: row['product_id'],
          entryType: isSellReturn ? 'sale_return' : 'sale_out',
          quantity: isSellReturn ? qty : -qty,
          unitCost: parseFloat(row['unit_price'] ?? '0') || null,
          referenceNo: row['invoice_no'] ?? null,
          note: `Migrated from legacy sell_line id=${row['id']}`,
          createdBy: row['created_by'] ?? 1,
          createdAt: toDate(row['created_at']) ?? new Date(),
        },
      });
      total++;
    }

    offset += BATCH_SIZE;
    process.stdout.write(`\r    ${total} stock entries (sales)…`);
  }

  console.log(`\n    ✓ ${total} stock entries total`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('=== Legacy Data Migration ===\n');

  legacyConn = await mysql.createConnection(LEGACY_DB_URL);
  console.log('✓ Connected to legacy DB\n');

  try {
    await migrateBusinesses();
    await migrateUsers();
    await migrateContacts();
    await migrateProducts();
    await migrateSales();
    await migratePurchases();
    await migratePayments();
    await migrateStockAdjustments();
    await migrateSaleLines();
    await migratePurchaseLines();
    await migrateInventory();

    console.log('\n=== Migration complete ✓ ===');
  } finally {
    await legacyConn.end();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('\n✗ Migration failed:', err);
  process.exit(1);
});
