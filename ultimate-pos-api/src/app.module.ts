import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { BusinessModule } from './business/business.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { UnitsModule } from './units/units.module';
import { ProductsModule } from './products/products.module';
import { ContactsModule } from './contacts/contacts.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { PosModule } from './pos/pos.module';
import { PurchasesModule } from './purchases/purchases.module';
import { ReportsModule } from './reports/reports.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CashRegisterModule } from './cash-register/cash-register.module';
import { TaxRatesModule } from './tax-rates/tax-rates.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { StockTransfersModule } from './stock-transfers/stock-transfers.module';
import { AccountingModule } from './accounting/accounting.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { CrmModule } from './crm/crm.module';
import { ManufacturingModule } from './manufacturing/manufacturing.module';
import { RepairModule } from './repair/repair.module';
import { AssetManagementModule } from './asset-management/asset-management.module';
import { ProjectModule } from './project/project.module';
import { EssentialsModule } from './essentials/essentials.module';
import { HmsModule } from './hms/hms.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { WoocommerceModule } from './woocommerce/woocommerce.module';
import { VariationsModule } from './variations/variations.module';
import { CustomerGroupsModule } from './customer-groups/customer-groups.module';
import { SellingPriceGroupsModule } from './selling-price-groups/selling-price-groups.module';
import { DiscountsModule } from './discounts/discounts.module';
import { WarrantiesModule } from './warranties/warranties.module';
import { NotificationTemplatesModule } from './notification-templates/notification-templates.module';
import { StockAdjustmentsModule } from './stock-adjustments/stock-adjustments.module';
import { BarcodeModule } from './barcode/barcode.module';
import { ImportExportModule } from './import-export/import-export.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { PushModule } from './push/push.module';
import { BackupModule } from './backup/backup.module';
import { ReportSchedulerModule } from './report-scheduler/report-scheduler.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { SanitizeMiddleware } from './common/sanitize.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/static',
      serveStaticOptions: { index: false },
    }),
    ThrottlerModule.forRoot([{
      name: 'default',
      ttl: 60000,  // 1 minute window
      limit: 120,  // 120 requests per minute (generous for API consumers)
    }]),
    CacheModule.register({
      isGlobal: true,
      ttl: 60,  // default TTL: 60 s (overridden per-call)
    }),
    PrismaModule,
    AuthModule,
    BusinessModule,
    CategoriesModule,
    BrandsModule,
    UnitsModule,
    ProductsModule,
    ContactsModule,
    InventoryModule,
    SalesModule,
    PosModule,
    PurchasesModule,
    ReportsModule,
    ExpensesModule,
    CashRegisterModule,
    TaxRatesModule,
    UsersModule,
    DocumentsModule,
    NotificationsModule,
    PaymentsModule,
    StockTransfersModule,
    AccountingModule,
    RestaurantModule,
    CrmModule,
    ManufacturingModule,
    RepairModule,
    AssetManagementModule,
    ProjectModule,
    EssentialsModule,
    HmsModule,
    SuperadminModule,
    WoocommerceModule,
    VariationsModule,
    CustomerGroupsModule,
    SellingPriceGroupsModule,
    DiscountsModule,
    WarrantiesModule,
    NotificationTemplatesModule,
    StockAdjustmentsModule,
    BarcodeModule,
    ImportExportModule,
    AuditLogsModule,
    PushModule,
    BackupModule,
    ReportSchedulerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SanitizeMiddleware).forRoutes('*');
  }
}
