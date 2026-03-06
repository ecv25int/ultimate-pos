-- CreateTable
CREATE TABLE `sales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `contact_id` INTEGER NULL,
    `invoice_no` VARCHAR(60) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'final',
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'due',
    `tax_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `discount_type` VARCHAR(10) NOT NULL DEFAULT 'fixed',
    `shipping_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `paid_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `transaction_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sales_business_id_idx`(`business_id`),
    INDEX `sales_contact_id_idx`(`contact_id`),
    INDEX `sales_status_idx`(`status`),
    INDEX `sales_payment_status_idx`(`payment_status`),
    INDEX `sales_invoice_no_idx`(`invoice_no`),
    INDEX `sales_transaction_date_idx`(`transaction_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sale_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `quantity` DECIMAL(22, 4) NOT NULL,
    `unit_price` DECIMAL(22, 4) NOT NULL,
    `discount_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `tax_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `line_total` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sale_lines_sale_id_idx`(`sale_id`),
    INDEX `sale_lines_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_lines` ADD CONSTRAINT `sale_lines_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_lines` ADD CONSTRAINT `sale_lines_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
