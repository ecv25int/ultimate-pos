-- CreateIndex
CREATE INDEX `cash_register_transactions_created_at_idx` ON `cash_register_transactions`(`created_at`);

-- CreateIndex
CREATE INDEX `contacts_name_idx` ON `contacts`(`name`);

-- CreateIndex
CREATE INDEX `contacts_email_idx` ON `contacts`(`email`);

-- CreateIndex
CREATE INDEX `products_sku_idx` ON `products`(`sku`);

-- CreateIndex
CREATE INDEX `products_type_idx` ON `products`(`type`);

-- CreateIndex
CREATE INDEX `purchases_ref_no_idx` ON `purchases`(`ref_no`);

-- CreateIndex
CREATE INDEX `purchases_type_idx` ON `purchases`(`type`);

-- CreateIndex
CREATE INDEX `purchases_business_id_purchase_date_idx` ON `purchases`(`business_id`, `purchase_date`);

-- CreateIndex
CREATE INDEX `sales_business_id_transaction_date_idx` ON `sales`(`business_id`, `transaction_date`);

-- CreateIndex
CREATE INDEX `variations_sub_sku_idx` ON `variations`(`sub_sku`);
