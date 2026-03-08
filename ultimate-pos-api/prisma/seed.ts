import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── 1. Default Business ───────────────────────────────────────────────────
  const business = await prisma.business.upsert({
    where: { id: 1 },
    create: {
      name: 'Ultimate POS Demo',
      currency: 'USD',
      timezone: 'America/New_York',
      country: 'United States',
      email: 'admin@ultimatepos.com',
      phone: '+1-555-0100',
      isActive: true,
    },
    update: {},
  });
  console.log(`✅ Business: "${business.name}" (id=${business.id})`);

  // ─── 2. Admin User ───────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    create: {
      username: 'admin',
      email: 'admin@ultimatepos.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      userType: 'superadmin',
      businessId: business.id,
      isActive: true,
    },
    update: {},
  });
  console.log(`✅ Admin user: "${adminUser.username}" (id=${adminUser.id})`);

  // Owner / manager demo user
  const managerPassword = await bcrypt.hash('manager123', 10);
  const managerUser = await prisma.user.upsert({
    where: { username: 'manager' },
    create: {
      username: 'manager',
      email: 'manager@ultimatepos.com',
      password: managerPassword,
      firstName: 'Store',
      lastName: 'Manager',
      userType: 'user',
      businessId: business.id,
      isActive: true,
    },
    update: {},
  });
  console.log(`✅ Manager user: "${managerUser.username}" (id=${managerUser.id})`);

  // ─── Additional demo users (2 per role) ──────────────────────────────────
  const roleUsers: Array<{
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: string;
  }> = [
    // superadmin
    { username: 'superadmin1', email: 'superadmin1@ultimatepos.com', password: 'superadmin123', firstName: 'Super',   lastName: 'Admin One',  userType: 'superadmin' },
    { username: 'superadmin2', email: 'superadmin2@ultimatepos.com', password: 'superadmin123', firstName: 'Super',   lastName: 'Admin Two',  userType: 'superadmin' },
    // admin
    { username: 'admin1',      email: 'admin1@ultimatepos.com',      password: 'admin123',      firstName: 'Admin',   lastName: 'One',        userType: 'admin'      },
    { username: 'admin2',      email: 'admin2@ultimatepos.com',      password: 'admin123',      firstName: 'Admin',   lastName: 'Two',        userType: 'admin'      },
    // manager
    { username: 'manager1',    email: 'manager1@ultimatepos.com',    password: 'manager123',    firstName: 'Manager', lastName: 'One',        userType: 'manager'    },
    { username: 'manager2',    email: 'manager2@ultimatepos.com',    password: 'manager123',    firstName: 'Manager', lastName: 'Two',        userType: 'manager'    },
    // cashier
    { username: 'cashier1',    email: 'cashier1@ultimatepos.com',    password: 'cashier123',    firstName: 'Cashier', lastName: 'One',        userType: 'cashier'    },
    { username: 'cashier2',    email: 'cashier2@ultimatepos.com',    password: 'cashier123',    firstName: 'Cashier', lastName: 'Two',        userType: 'cashier'    },
    // user
    { username: 'user1',       email: 'user1@ultimatepos.com',       password: 'user123',       firstName: 'Basic',   lastName: 'User One',   userType: 'user'       },
    { username: 'user2',       email: 'user2@ultimatepos.com',       password: 'user123',       firstName: 'Basic',   lastName: 'User Two',   userType: 'user'       },
  ];

  for (const u of roleUsers) {
    const hashed = await bcrypt.hash(u.password, 10);
    const created = await prisma.user.upsert({
      where: { username: u.username },
      create: {
        username:   u.username,
        email:      u.email,
        password:   hashed,
        firstName:  u.firstName,
        lastName:   u.lastName,
        userType:   u.userType,
        businessId: business.id,
        isActive:   true,
      },
      update: {},
    });
    console.log(`✅ ${u.userType.padEnd(11)} user: "${created.username}"`);
  }

  // ─── 3. Business Location ─────────────────────────────────────────────────
  const location = await prisma.businessLocation.upsert({
    where: { id: 1 },
    create: {
      businessId: business.id,
      name: 'Main Store',
      landmarkCity: 'New York',
      state: 'NY',
      country: 'United States',
      zipCode: '10001',
      email: 'store@ultimatepos.com',
      isActive: true,
    },
    update: {},
  });
  console.log(`✅ Location: "${location.name}" (id=${location.id})`);

  // ─── 4. Tax Rates ─────────────────────────────────────────────────────────
  const taxRates = [
    { name: 'No Tax',        rate: 0,  isDefault: true  },
    { name: 'VAT 5%',        rate: 5,  isDefault: false },
    { name: 'VAT 10%',       rate: 10, isDefault: false },
    { name: 'VAT 20%',       rate: 20, isDefault: false },
    { name: 'Sales Tax 8%',  rate: 8,  isDefault: false },
  ];

  for (const tax of taxRates) {
    const existing = await prisma.taxRate.findFirst({
      where: { businessId: business.id, name: tax.name },
    });
    if (!existing) {
      await prisma.taxRate.create({
        data: {
          businessId: business.id,
          name: tax.name,
          rate: tax.rate,
          type: 'percentage',
          isDefault: tax.isDefault,
          createdBy: adminUser.id,
        },
      });
      console.log(`✅ Tax rate: "${tax.name}"`);
    } else {
      console.log(`⏭  Tax rate "${tax.name}" already exists`);
    }
  }

  // ─── 5. Invoice Layout ────────────────────────────────────────────────────
  const invoiceLayout = await prisma.invoiceLayout.upsert({
    where: { id: 1 },
    create: {
      businessId: business.id,
      name: 'Default Layout',
      invoiceHeading: 'INVOICE',
      invoiceNoLabel: 'Invoice No.',
      dateLabel: 'Date',
      dueDateLabel: 'Due Date',
      headerText: 'Thank you for your business!',
      footerText: 'All prices are inclusive of applicable taxes.',
      highlightColor: '#3f51b5',
    },
    update: {},
  });
  console.log(`✅ Invoice Layout: "${invoiceLayout.name}" (id=${invoiceLayout.id})`);

  // ─── 6. Invoice Scheme ────────────────────────────────────────────────────
  const invoiceScheme = await prisma.invoiceScheme.upsert({
    where: { id: 1 },
    create: {
      businessId: business.id,
      name: 'Default Sales Scheme',
      schemeType: 'sale',
      prefix: 'INV-',
      invoiceLayoutId: invoiceLayout.id,
      startNumber: 1,
      totalDigits: 5,
      isDefault: true,
      invoiceCount: 0,
    },
    update: {},
  });
  console.log(`✅ Invoice Scheme: "${invoiceScheme.name}" (prefix=${invoiceScheme.prefix})`);

  const purchaseScheme = await prisma.invoiceScheme.upsert({
    where: { id: 2 },
    create: {
      businessId: business.id,
      name: 'Default Purchase Scheme',
      schemeType: 'purchase',
      prefix: 'PO-',
      invoiceLayoutId: invoiceLayout.id,
      startNumber: 1,
      totalDigits: 5,
      isDefault: true,
      invoiceCount: 0,
    },
    update: {},
  });
  console.log(`✅ Purchase Scheme: "${purchaseScheme.name}" (prefix=${purchaseScheme.prefix})`);

  // ─── 7. Expense Categories ────────────────────────────────────────────────
  const expenseCategories = [
    'General',
    'Utilities',
    'Salaries & Wages',
    'Maintenance & Repairs',
    'Marketing & Advertising',
    'Rent & Lease',
    'Office Supplies',
    'Travel & Transportation',
  ];

  for (const categoryName of expenseCategories) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { businessId: business.id, name: categoryName },
    });
    if (!existing) {
      await prisma.expenseCategory.create({
        data: {
          businessId: business.id,
          name: categoryName,
          createdBy: adminUser.id,
        },
      });
      console.log(`✅ Expense category: "${categoryName}"`);
    } else {
      console.log(`⏭  Expense category "${categoryName}" already exists`);
    }
  }

  // ─── 8. Default Units ─────────────────────────────────────────────────────
  const units = [
    { actualName: 'Piece',    shortName: 'PC',  allowDecimal: false },
    { actualName: 'Kilogram', shortName: 'KG',  allowDecimal: true  },
    { actualName: 'Gram',     shortName: 'G',   allowDecimal: true  },
    { actualName: 'Litre',    shortName: 'L',   allowDecimal: true  },
    { actualName: 'Metre',    shortName: 'M',   allowDecimal: true  },
    { actualName: 'Box',      shortName: 'BOX', allowDecimal: false },
    { actualName: 'Dozen',    shortName: 'DZ',  allowDecimal: false },
  ];

  for (const unit of units) {
    const existing = await prisma.unit.findFirst({
      where: { businessId: business.id, shortName: unit.shortName },
    });
    if (!existing) {
      await prisma.unit.create({
        data: {
          businessId: business.id,
          ...unit,
          createdBy: adminUser.id,
        },
      });
      console.log(`✅ Unit: "${unit.actualName}" (${unit.shortName})`);
    } else {
      console.log(`⏭  Unit "${unit.shortName}" already exists`);
    }
  }

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────────────');
  console.log('  Login credentials:');
  console.log('  superadmin → admin          / admin123');
  console.log('  superadmin → superadmin1    / superadmin123');
  console.log('  superadmin → superadmin2    / superadmin123');
  console.log('  admin      → admin1         / admin123');
  console.log('  admin      → admin2         / admin123');
  console.log('  manager    → manager        / manager123  (legacy, userType=user)');
  console.log('  manager    → manager1       / manager123');
  console.log('  manager    → manager2       / manager123');
  console.log('  cashier    → cashier1       / cashier123');
  console.log('  cashier    → cashier2       / cashier123');
  console.log('  user       → user1          / user123');
  console.log('  user       → user2          / user123');
  console.log('  API        → http://localhost:3000/api');
  console.log('  Docs       → http://localhost:3000/api/docs');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
