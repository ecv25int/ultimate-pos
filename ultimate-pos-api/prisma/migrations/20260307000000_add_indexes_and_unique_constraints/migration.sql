-- CreateIndex
CREATE INDEX `brands_deleted_at_idx` ON `brands`(`deleted_at`);

-- CreateIndex
CREATE INDEX `categories_deleted_at_idx` ON `categories`(`deleted_at`);

-- CreateIndex
CREATE INDEX `contacts_deleted_at_idx` ON `contacts`(`deleted_at`);

-- CreateIndex
CREATE INDEX `expense_categories_deleted_at_idx` ON `expense_categories`(`deleted_at`);

-- CreateIndex
CREATE INDEX `expenses_deleted_at_idx` ON `expenses`(`deleted_at`);

-- CreateIndex
CREATE INDEX `hms_room_types_deleted_at_idx` ON `hms_room_types`(`deleted_at`);

-- CreateIndex
CREATE INDEX `hms_rooms_deleted_at_idx` ON `hms_rooms`(`deleted_at`);

-- CreateIndex
CREATE INDEX `packages_deleted_at_idx` ON `packages`(`deleted_at`);

-- CreateIndex
CREATE INDEX `purchases_deleted_at_idx` ON `purchases`(`deleted_at`);

-- CreateIndex
CREATE UNIQUE INDEX `purchases_business_id_ref_no_key` ON `purchases`(`business_id`, `ref_no`);

-- CreateIndex
CREATE INDEX `sales_deleted_at_idx` ON `sales`(`deleted_at`);

-- CreateIndex
CREATE UNIQUE INDEX `sales_business_id_invoice_no_key` ON `sales`(`business_id`, `invoice_no`);

-- CreateIndex
CREATE INDEX `selling_price_groups_deleted_at_idx` ON `selling_price_groups`(`deleted_at`);

-- CreateIndex
CREATE INDEX `subscriptions_deleted_at_idx` ON `subscriptions`(`deleted_at`);

-- CreateIndex
CREATE INDEX `tax_rates_deleted_at_idx` ON `tax_rates`(`deleted_at`);

-- CreateIndex
CREATE INDEX `units_deleted_at_idx` ON `units`(`deleted_at`);

-- CreateIndex
CREATE INDEX `variations_deleted_at_idx` ON `variations`(`deleted_at`);
