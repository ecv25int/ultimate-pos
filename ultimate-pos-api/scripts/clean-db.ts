import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  console.log('Cleaning transactional data...');

  // Delete leaf tables first to respect FK constraints
  const r1  = await p.crmCallLog.deleteMany({});
  console.log('crm_call_logs:              ', r1.count);

  const r2  = await p.crmSchedule.deleteMany({});
  console.log('crm_schedules:              ', r2.count);

  const r3  = await p.crmCampaign.deleteMany({});
  console.log('crm_campaigns:              ', r3.count);

  const r4  = await p.booking.deleteMany({});
  console.log('bookings:                   ', r4.count);

  const r5  = await p.resTable.deleteMany({});
  console.log('res_tables:                 ', r5.count);

  const r6  = await p.accountTransaction.deleteMany({});
  console.log('account_transactions:       ', r6.count);

  const r7  = await p.account.deleteMany({});
  console.log('accounts:                   ', r7.count);

  const r8  = await p.notification.deleteMany({});
  console.log('notifications:              ', r8.count);

  const r9  = await p.stockTransfer.deleteMany({});
  console.log('stock_transfers:            ', r9.count);

  const r10 = await p.payment.deleteMany({});
  console.log('payments:                   ', r10.count);

  const r11 = await p.cashRegisterTransaction.deleteMany({});
  console.log('cash_register_transactions: ', r11.count);

  const r12 = await p.cashRegister.deleteMany({});
  console.log('cash_registers:             ', r12.count);

  const r13 = await p.purchaseLine.deleteMany({});
  console.log('purchase_lines:             ', r13.count);

  const r14 = await p.purchase.deleteMany({});
  console.log('purchases:                  ', r14.count);

  const r15 = await p.saleLine.deleteMany({});
  console.log('sale_lines:                 ', r15.count);

  const r16 = await p.sale.deleteMany({});
  console.log('sales:                      ', r16.count);

  const r17 = await p.expense.deleteMany({});
  console.log('expenses:                   ', r17.count);

  const r18 = await p.stockEntry.deleteMany({});
  console.log('stock_entries:              ', r18.count);

  const r19 = await p.contact.deleteMany({});
  console.log('contacts:                   ', r19.count);

  const r20 = await p.product.deleteMany({});
  console.log('products:                   ', r20.count);

  console.log('\nDone. Seed data (users, business, tax rates, categories, units, etc.) preserved.');
}

main()
  .catch((e) => { console.error(e.message); process.exit(1); })
  .finally(() => p.$disconnect());
