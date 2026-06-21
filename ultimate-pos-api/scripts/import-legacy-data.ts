import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const migrationDataDir = path.join(__dirname, '../../migration-data');

function readJsonFile(filename: string): any {
  const filePath = path.join(migrationDataDir, filename);
  console.log(`Reading ${filePath}...`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

async function main() {
  console.log('🚀 Starting legacy data import...');

  // 1. Truncate all tables in topological order
  console.log('Truncating existing tables...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  const tables = [
    'crm_call_logs',
    'crm_schedules',
    'crm_campaigns',
    'bookings',
    'res_tables',
    'notifications',
    'stock_transfers',
    'cash_register_transactions',
    'cash_registers',
    'transaction_sell_lines_purchase_lines',
    'account_transactions',
    'accounts',
    'account_types',
    'payments',
    'sale_lines',
    'sales',
    'purchase_lines',
    'purchases',
    'expenses',
    'expense_categories',
    'stock_entries',
    'stock_movements',
    'variation_location_details',
    'variations',
    'product_variations',
    'products',
    'contacts',
    'brands',
    'categories',
    'units',
    'tax_rates',
    'business_locations',
    'invoice_schemes',
    'invoice_layouts',
    'users',
    'business'
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
  }

  console.log('Table truncation completed.');

  // 2. Load JSON files
  const businessConfig = readJsonFile('business_config.json');
  const usersData = readJsonFile('users.json');
  const productsData = readJsonFile('products.json');
  const contactsData = readJsonFile('contacts.json');
  const transactionsData = readJsonFile('transactions.json');
  const accountsData = readJsonFile('accounts.json');

  // 3. Import Business Config (Business, InvoiceLayouts, InvoiceSchemes, Locations, TaxRates, ExpenseCategories, Units, Categories, Brands)
  console.log('Importing businesses...');
  for (const b of businessConfig.business) {
    await prisma.business.create({
      data: {
        id: b.id,
        name: b.name,
        currency: b.currency_id === 2 ? 'INR' : 'USD',
        timezone: b.time_zone || 'UTC',
        country: b.country || null,
        state: b.state || null,
        city: b.city || null,
        zipCode: b.zip_code || null,
        address: b.address || null,
        phone: b.phone || null,
        email: b.email || null,
        website: b.website || null,
        logo: b.logo || null,
        taxNumber: b.tax_number_1 || null,
        isActive: b.is_active === 1,
        createdAt: new Date(b.created_at),
        updatedAt: new Date(b.updated_at),
      },
    });
  }

  console.log('Importing users...');
  for (const u of usersData) {
    let password = u.password;
    let userType = u.user_type || 'user';
    if (u.username === 'admin') {
      userType = 'superadmin';
      password = await bcrypt.hash('admin123', 10);
    }
    await prisma.user.create({
      data: {
        id: u.id,
        username: u.username,
        email: u.email || null,
        password: password,
        firstName: u.first_name || null,
        lastName: u.last_name || null,
        userType: userType,
        businessId: u.business_id,
        isActive: u.status === 'active',
        locale: u.language || 'en',
        createdAt: new Date(u.created_at),
        updatedAt: new Date(u.updated_at),
      },
    });
  }

  console.log('Importing invoice layouts...');
  for (const l of businessConfig.invoice_layouts) {
    await prisma.invoiceLayout.create({
      data: {
        id: l.id,
        businessId: l.business_id,
        name: l.name,
        headerText: l.header_text || null,
        footerText: l.footer_text || null,
        invoiceHeading: l.invoice_heading || null,
        invoiceNoLabel: l.invoice_no_label || null,
        dateLabel: l.date_label || null,
        dueDateLabel: l.due_date_label || null,
        highlightColor: l.highlight_color || null,
        subHeading1: l.sub_heading_1 || null,
        subHeading2: l.sub_heading_2 || null,
        subHeading3: l.sub_heading_3 || null,
        subHeading4: l.sub_heading_4 || null,
        subHeading5: l.sub_heading_5 || null,
        showBusinessName: l.show_business_name === 1,
        showLocationName: l.show_location_name === 1,
        showMobileNumber: l.show_mobile_number === 1,
        showEmail: l.show_email === 1,
        showTax1: l.show_tax_1 === 1,
        showTax2: l.show_tax_2 === 1,
        showTaxTotal: l.show_tax_total === 1,
        showLogo: l.show_logo === 1,
        showBarcode: l.show_barcode === 1,
        showPaymentMethods: l.show_payment_methods === 1,
        isDefault: l.is_default === 1,
        createdAt: new Date(l.created_at),
        updatedAt: new Date(l.updated_at),
      },
    });
  }

  console.log('Importing invoice schemes...');
  for (const s of businessConfig.invoice_schemes) {
    await prisma.invoiceScheme.create({
      data: {
        id: s.id,
        businessId: s.business_id,
        name: s.name,
        schemeType: s.scheme_type || 'sale',
        prefix: s.prefix || null,
        invoiceLayoutId: s.invoice_layout_id || null,
        startNumber: s.start_number || 1,
        totalDigits: s.total_digits || 4,
        isDefault: s.is_default === 1,
        invoiceCount: s.invoice_count || 0,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      },
    });
  }

  console.log('Importing business locations...');
  for (const l of businessConfig.business_locations) {
    await prisma.businessLocation.create({
      data: {
        id: l.id,
        businessId: l.business_id,
        name: l.name,
        landmarkCity: l.landmark || null,
        state: l.state || null,
        country: l.country || null,
        zipCode: l.zip_code || null,
        mobile: l.mobile || null,
        alternateNumber: l.alternate_number || null,
        email: l.email || null,
        website: l.website || null,
        featuredProducts: l.featured_products || 0,
        isActive: l.is_active === 1,
        createdAt: new Date(l.created_at),
        updatedAt: new Date(l.updated_at),
      },
    });
  }

  console.log('Importing tax rates...');
  for (const t of businessConfig.tax_rates) {
    await prisma.taxRate.create({
      data: {
        id: t.id,
        businessId: t.business_id,
        name: t.name,
        rate: t.amount,
        type: 'percentage',
        isDefault: false,
        isActive: true,
        createdBy: t.created_by || 1,
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at),
      },
    });
  }

  console.log('Importing expense categories...');
  for (const ec of businessConfig.expense_categories) {
    await prisma.expenseCategory.create({
      data: {
        id: ec.id,
        businessId: ec.business_id,
        name: ec.name,
        description: ec.code || null,
        createdBy: ec.created_by || 1,
        createdAt: new Date(ec.created_at),
        updatedAt: new Date(ec.updated_at),
      },
    });
  }

  console.log('Importing units...');
  for (const u of businessConfig.units) {
    await prisma.unit.create({
      data: {
        id: u.id,
        businessId: u.business_id,
        actualName: u.actual_name,
        shortName: u.short_name,
        allowDecimal: u.allow_decimal === 1,
        createdBy: u.created_by || 1,
        createdAt: new Date(u.created_at),
        updatedAt: new Date(u.updated_at),
      },
    });
  }

  console.log('Importing categories...');
  for (const c of businessConfig.categories) {
    await prisma.category.create({
      data: {
        id: c.id,
        businessId: c.business_id,
        name: c.name,
        shortCode: c.short_code || null,
        parentId: c.parent_id === 0 ? null : c.parent_id,
        createdBy: c.created_by || 1,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      },
    });
  }

  console.log('Importing brands...');
  for (const b of businessConfig.brands) {
    await prisma.brand.create({
      data: {
        id: b.id,
        businessId: b.business_id,
        name: b.name,
        description: b.description || null,
        createdBy: b.created_by || 1,
        createdAt: new Date(b.created_at),
        updatedAt: new Date(b.updated_at),
      },
    });
  }

  // 4. Import Products (Products, ProductVariations, Variations)
  console.log('Importing products...');
  for (const p of productsData.products) {
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        businessId: p.business_id,
        type: p.type || 'single',
        unitId: p.unit_id,
        brandId: p.brand_id || null,
        categoryId: p.category_id || null,
        subCategoryId: p.sub_category_id || null,
        sku: p.sku,
        barcodeType: p.barcode_type || 'C128',
        enableStock: p.enable_stock === 1,
        alertQuantity: p.alert_quantity || 0,
        warrantyId: p.warranty_id || null,
        imageUrl: p.image || null,
        createdBy: p.created_by || 1,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      },
    });
  }

  console.log('Importing product variations...');
  for (const pv of productsData.product_variations) {
    await prisma.productVariation.create({
      data: {
        id: pv.id,
        productId: pv.product_id,
        name: pv.name,
        isDummy: pv.is_dummy === 1,
        createdAt: new Date(pv.created_at),
        updatedAt: new Date(pv.updated_at),
      },
    });
  }

  console.log('Importing variations...');
  for (const v of productsData.variations) {
    await prisma.variation.create({
      data: {
        id: v.id,
        productId: v.product_id,
        productVariationId: v.product_variation_id,
        name: v.name,
        subSku: v.sub_sku || null,
        defaultPurchasePrice: v.default_purchase_price || null,
        dppIncTax: v.dpp_inc_tax || 0,
        profitPercent: v.profit_percent || 0,
        defaultSellPrice: v.default_sell_price || null,
        sellPriceIncTax: v.sell_price_inc_tax || null,
        deletedAt: v.deleted_at ? new Date(v.deleted_at) : null,
        createdAt: new Date(v.created_at),
        updatedAt: new Date(v.updated_at),
      },
    });
  }

  // 5. Import Contacts
  console.log('Importing contacts...');
  for (const c of contactsData) {
    await prisma.contact.create({
      data: {
        id: c.id,
        businessId: c.business_id,
        type: c.type === 'customer_supplier' ? 'both' : c.type,
        supplierBusinessName: c.supplier_business_name || null,
        name: c.name || [c.prefix, c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unnamed Contact',
        email: c.email || null,
        taxNumber: c.tax_number || null,
        city: c.city || null,
        state: c.state || null,
        country: c.country || null,
        landmark: c.address_line_1 || null,
        mobile: c.mobile || '00000000',
        landline: c.landline || null,
        alternateNumber: c.alternate_number || null,
        payTermNumber: c.pay_term_number || null,
        payTermType: c.pay_term_type || null,
        creditLimit: c.credit_limit || null,
        balance: c.balance || 0,
        isDefault: c.is_default === 1,
        contactStatus: c.contact_status || 'active',
        shippingAddress: c.shipping_address || null,
        position: c.position || null,
        customerGroupId: c.customer_group_id || null,
        createdBy: c.created_by || 1,
        deletedAt: c.deleted_at ? new Date(c.deleted_at) : null,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      },
    });
  }

  // 6. Map and split Transactions
  console.log('Mapping transactions...');
  const txsMap = new Map<number, any>();
  for (const t of transactionsData.transactions) {
    txsMap.set(t.id, t);
  }

  console.log('Importing sales...');
  for (const t of transactionsData.transactions) {
    if (['sell', 'sell_return'].includes(t.type)) {
      await prisma.sale.create({
        data: {
          id: t.id,
          businessId: t.business_id,
          contactId: t.contact_id || null,
          invoiceNo: t.invoice_no || `SALE-${t.id}`,
          status: t.status || 'final',
          paymentStatus: t.payment_status || 'due',
          taxAmount: t.tax_amount || 0,
          discountAmount: t.discount_amount || 0,
          discountType: t.discount_type || 'fixed',
          shippingAmount: t.shipping_charges || 0,
          totalAmount: t.final_total || 0,
          paidAmount: 0,
          note: t.additional_notes || null,
          transactionDate: new Date(t.transaction_date),
          type: t.type === 'sell_return' ? 'sale_return' : 'sale',
          returnOfId: t.return_parent_id || null,
          createdBy: t.created_by || 1,
          isRecurring: t.is_recurring === 1,
          recurInterval: t.recur_interval || null,
          recurIntervalType: t.recur_interval_type || null,
          recurRepetitions: t.recur_repetitions || null,
          recurStoppedOn: t.recur_stopped_on ? new Date(t.recur_stopped_on) : null,
          recurParentId: t.recur_parent_id || null,
          deletedAt: t.deleted_at ? new Date(t.deleted_at) : null,
          createdAt: new Date(t.created_at),
          updatedAt: new Date(t.updated_at),
        },
      });
    }
  }

  console.log('Importing purchases...');
  for (const t of transactionsData.transactions) {
    if (['purchase', 'purchase_return', 'opening_stock'].includes(t.type)) {
      await prisma.purchase.create({
        data: {
          id: t.id,
          businessId: t.business_id,
          contactId: t.contact_id || null,
          refNo: t.ref_no || t.invoice_no || `PUR-${t.id}`,
          status: t.status || 'received',
          paymentStatus: t.payment_status || 'due',
          taxAmount: t.tax_amount || 0,
          discountAmount: t.discount_amount || 0,
          shippingAmount: t.shipping_charges || 0,
          totalAmount: t.final_total || 0,
          paidAmount: 0,
          note: t.additional_notes || null,
          purchaseDate: new Date(t.transaction_date),
          type: t.type === 'purchase_return' ? 'purchase_return' : 'purchase',
          returnOfId: t.return_parent_id || null,
          createdBy: t.created_by || 1,
          deletedAt: t.deleted_at ? new Date(t.deleted_at) : null,
          createdAt: new Date(t.created_at),
          updatedAt: new Date(t.updated_at),
        },
      });
    }
  }

  console.log('Importing expenses...');
  for (const t of transactionsData.transactions) {
    if (t.type === 'expense') {
      const totalVal = Number(t.final_total || 0);
      const taxVal = Number(t.tax_amount || 0);
      const amtVal = totalVal - taxVal;
      await prisma.expense.create({
        data: {
          id: t.id,
          businessId: t.business_id,
          expenseCategoryId: t.expense_category_id || null,
          refNo: t.ref_no || t.invoice_no || `EXP-${t.id}`,
          amount: amtVal,
          taxAmount: taxVal,
          totalAmount: totalVal,
          note: t.additional_notes || null,
          expenseDate: new Date(t.transaction_date),
          createdBy: t.created_by || 1,
          deletedAt: t.deleted_at ? new Date(t.deleted_at) : null,
          createdAt: new Date(t.created_at),
          updatedAt: new Date(t.updated_at),
        },
      });
    }
  }

  // 7. Import Sale & Purchase Lines
  console.log('Importing sale lines...');
  for (const sl of transactionsData.transaction_sell_lines) {
    const qty = Number(sl.quantity || 0);
    const priceBefore = sl.unit_price_before_discount ? Number(sl.unit_price_before_discount) : Number(sl.unit_price || 0);
    const priceAfter = Number(sl.unit_price || 0);
    const discTotal = (priceBefore - priceAfter) * qty;
    const itemTaxTotal = Number(sl.item_tax || 0) * qty;
    const lineTotal = qty * priceAfter + itemTaxTotal;

    await prisma.saleLine.create({
      data: {
        id: sl.id,
        saleId: sl.transaction_id,
        productId: sl.product_id,
        variationId: sl.variation_id || null,
        quantity: qty,
        unitPrice: priceBefore,
        discountAmount: discTotal,
        taxAmount: itemTaxTotal,
        lineTotal: lineTotal,
        note: sl.sell_line_note || null,
        createdAt: new Date(sl.created_at),
        updatedAt: new Date(sl.updated_at),
      },
    });
  }

  console.log('Importing purchase lines...');
  for (const pl of transactionsData.purchase_lines) {
    const qty = Number(pl.quantity || 0);
    const beforeCost = Number(pl.pp_without_discount || pl.purchase_price || 0);
    const afterCost = Number(pl.purchase_price_inc_tax || 0);
    const discountPercent = Number(pl.discount_percent || 0);
    const discTotal = beforeCost * qty * (discountPercent / 100);
    const itemTaxTotal = Number(pl.item_tax || 0) * qty;
    const lineTotal = qty * afterCost;

    await prisma.purchaseLine.create({
      data: {
        id: pl.id,
        purchaseId: pl.transaction_id,
        productId: pl.product_id,
        variationId: pl.variation_id || null,
        quantity: qty,
        unitCostBefore: beforeCost,
        unitCostAfter: afterCost,
        discountAmount: discTotal,
        taxAmount: itemTaxTotal,
        lineTotal: lineTotal,
        note: null,
        batchNumber: pl.lot_number || null,
        expiryDate: pl.exp_date ? new Date(pl.exp_date) : null,
        quantitySold: pl.quantity_sold || 0,
        quantityAdjusted: pl.quantity_adjusted || 0,
        createdAt: new Date(pl.created_at),
        updatedAt: new Date(pl.updated_at),
      },
    });
  }

  // 8. Import Payments
  console.log('Importing payments...');
  for (const p of transactionsData.transaction_payments) {
    let methodMapped = 'cash';
    const legacyMethod = (p.method || '').toLowerCase();
    if (['cash', 'card', 'bank_transfer', 'check', 'other'].includes(legacyMethod)) {
      methodMapped = legacyMethod;
    } else if (legacyMethod === 'cheque') {
      methodMapped = 'check';
    } else {
      methodMapped = 'other';
    }

    const parentTx = txsMap.get(p.transaction_id);
    let saleId: number | null = null;
    let purchaseId: number | null = null;
    if (parentTx) {
      if (['sell', 'sell_return'].includes(parentTx.type)) {
        saleId = p.transaction_id;
      } else if (['purchase', 'purchase_return', 'opening_stock'].includes(parentTx.type)) {
        purchaseId = p.transaction_id;
      }
    }

    const businessId = p.business_id || parentTx?.business_id || 1;

    await prisma.payment.create({
      data: {
        id: p.id,
        businessId,
        saleId,
        purchaseId,
        amount: p.amount,
        method: methodMapped,
        referenceNo: p.payment_ref_no || null,
        note: p.note || null,
        paymentDate: new Date(p.paid_on),
        createdBy: p.created_by || 1,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      },
    });
  }

  // Update paidAmount on Sales & Purchases
  console.log('Updating paid amounts on transactions...');
  const salePayments = await prisma.payment.groupBy({
    by: ['saleId'],
    _sum: { amount: true },
    where: { saleId: { not: null } },
  });
  for (const sp of salePayments) {
    if (sp.saleId) {
      await prisma.sale.update({
        where: { id: sp.saleId },
        data: { paidAmount: sp._sum.amount || 0 },
      });
    }
  }

  const purchasePayments = await prisma.payment.groupBy({
    by: ['purchaseId'],
    _sum: { amount: true },
    where: { purchaseId: { not: null } },
  });
  for (const pp of purchasePayments) {
    if (pp.purchaseId) {
      await prisma.purchase.update({
        where: { id: pp.purchaseId },
        data: { paidAmount: pp._sum.amount || 0 },
      });
    }
  }

  // 9. Import FIFO Lines
  console.log('Importing FIFO lines...');
  for (const f of transactionsData.fifo_lines) {
    await prisma.transactionSellLinesPurchaseLines.create({
      data: {
        id: f.id,
        sellLineId: f.sell_line_id,
        purchaseLineId: f.purchase_line_id,
        quantity: f.quantity,
        createdAt: new Date(f.created_at),
        updatedAt: new Date(f.updated_at),
      },
    });
  }

  // 10. Import Accounts & GL transactions
  console.log('Importing account types...');
  await prisma.accountType.create({
    data: {
      id: 2,
      businessId: 1,
      name: 'Cash',
      rootType: 'asset',
    },
  });
  await prisma.accountType.create({
    data: {
      id: 3,
      businessId: 1,
      name: 'Bank',
      rootType: 'asset',
    },
  });

  console.log('Importing accounts...');
  for (const a of accountsData.accounts) {
    await prisma.account.create({
      data: {
        id: a.id,
        businessId: a.business_id,
        accountTypeId: a.account_type_id,
        parentId: a.parent_id || null,
        name: a.name,
        accountNumber: a.account_number,
        note: a.note || null,
        isClosed: a.is_closed === 1,
        accountDetails: a.account_details || null,
        createdBy: a.created_by || 1,
        createdAt: new Date(a.created_at),
        updatedAt: new Date(a.updated_at),
      },
    });
  }

  console.log('Importing account transactions...');
  for (const at of accountsData.account_transactions) {
    await prisma.accountTransaction.create({
      data: {
        id: at.id,
        accountId: at.account_id,
        type: at.type,
        subType: at.sub_type || null,
        amount: at.amount,
        referenceNo: at.reff_no || null,
        operationDate: new Date(at.operation_date),
        note: at.note || null,
        linkedTransactionId: at.transaction_id || null,
        createdBy: at.created_by || 1,
        createdAt: new Date(at.created_at),
        updatedAt: new Date(at.updated_at),
      },
    });
  }

  // 11. Reconstruct Stock Inventory Levels
  console.log('Reconstructing stock levels, entries and movements...');
  const locationDetails = new Map<string, number>();

  // Received Purchases / Opening Stock
  const allPurchases = await prisma.purchase.findMany({
    where: { status: 'received' },
    include: { lines: true },
  });
  for (const pur of allPurchases) {
    const locId = 1;
    for (const pl of pur.lines) {
      if (!pl.variationId) continue;
      const key = `${pl.variationId}_${locId}`;
      const qty = Number(pl.quantity);
      locationDetails.set(key, (locationDetails.get(key) || 0) + qty);

      await prisma.stockEntry.create({
        data: {
          businessId: pur.businessId,
          productId: pl.productId,
          entryType: pur.type === 'purchase_return' ? 'adjustment_out' : (pur.refNo?.startsWith('OB') ? 'opening_stock' : 'purchase'),
          quantity: pur.type === 'purchase_return' ? -qty : qty,
          referenceNo: pur.refNo || `PUR-${pur.id}`,
          createdBy: pur.createdBy,
          createdAt: pur.purchaseDate,
          updatedAt: pur.purchaseDate,
        },
      });

      await prisma.stockMovement.create({
        data: {
          businessId: pur.businessId,
          variationId: pl.variationId,
          locationId: locId,
          type: pur.type === 'purchase_return' ? 'return' : 'purchase',
          quantity: pur.type === 'purchase_return' ? -qty : qty,
          referenceNo: pur.refNo || `PUR-${pur.id}`,
          note: pur.note || null,
          createdAt: pur.purchaseDate,
        },
      });
    }
  }

  // Sales and Returns
  const allSales = await prisma.sale.findMany({
    where: { status: { in: ['final', 'return'] } },
    include: { lines: true },
  });
  for (const sale of allSales) {
    const locId = 1;
    for (const sl of sale.lines) {
      if (!sl.variationId) continue;
      const key = `${sl.variationId}_${locId}`;
      const qty = Number(sl.quantity);

      if (sale.type === 'sale_return') {
        locationDetails.set(key, (locationDetails.get(key) || 0) + qty);

        await prisma.stockEntry.create({
          data: {
            businessId: sale.businessId,
            productId: sl.productId,
            entryType: 'sale_return',
            quantity: qty,
            referenceNo: sale.invoiceNo || `RET-${sale.id}`,
            createdBy: sale.createdBy,
            createdAt: sale.transactionDate,
            updatedAt: sale.transactionDate,
          },
        });

        await prisma.stockMovement.create({
          data: {
            businessId: sale.businessId,
            variationId: sl.variationId,
            locationId: locId,
            type: 'return',
            quantity: qty,
            referenceNo: sale.invoiceNo || `RET-${sale.id}`,
            note: sale.note || null,
            createdAt: sale.transactionDate,
          },
        });
      } else {
        locationDetails.set(key, (locationDetails.get(key) || 0) - qty);

        await prisma.stockEntry.create({
          data: {
            businessId: sale.businessId,
            productId: sl.productId,
            entryType: 'sale_out',
            quantity: -qty,
            referenceNo: sale.invoiceNo || `SALE-${sale.id}`,
            createdBy: sale.createdBy,
            createdAt: sale.transactionDate,
            updatedAt: sale.transactionDate,
          },
        });

        await prisma.stockMovement.create({
          data: {
            businessId: sale.businessId,
            variationId: sl.variationId,
            locationId: locId,
            type: 'sale',
            quantity: -qty,
            referenceNo: sale.invoiceNo || `SALE-${sale.id}`,
            note: sale.note || null,
            createdAt: sale.transactionDate,
          },
        });
      }
    }
  }

  // Populate VariationLocationDetails
  for (const [key, qty] of locationDetails.entries()) {
    const [variationIdStr, locationIdStr] = key.split('_');
    const variationId = parseInt(variationIdStr, 10);
    const locationId = parseInt(locationIdStr, 10);

    const variation = await prisma.variation.findUnique({
      where: { id: variationId },
    });
    if (variation) {
      await prisma.variationLocationDetails.create({
        data: {
          productId: variation.productId,
          productVariationId: variation.productVariationId,
          variationId,
          locationId,
          qtyAvailable: qty,
        },
      });
    }
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('🎉 Legacy data import complete!');
}

main()
  .catch((e) => {
    console.error('❌ Data import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
