import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const roles = [
  {
    name: 'admin',
    permissions: [
      'sales.view', 'sales.create', 'sales.update', 'sales.delete',
      'purchase.view', 'purchase.create', 'purchase.update',
      'reports.view',
    ],
  },
  {
    name: 'manager',
    permissions: [
      'sales.view', 'sales.create', 'sales.update',
      'purchase.view', 'purchase.create',
      'reports.view',
    ],
  },
  {
    name: 'cashier',
    permissions: [
      'sales.view', 'sales.create',
    ],
  },
  {
    name: 'user',
    permissions: [],
  },
];

async function main() {
  for (const role of roles) {
    console.log(`Role: ${role.name}`);
    for (const perm of role.permissions) {
      console.log(`  - ${perm}`);
    }
  }
  console.log('Roles/permissions are code-based (userType field). No DB changes needed.');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
