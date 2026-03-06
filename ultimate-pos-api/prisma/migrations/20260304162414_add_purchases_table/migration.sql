-- CreateTable
CREATE TABLE `purchases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `contact_id` INTEGER NULL,
    `ref_no` VARCHAR(60) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'received',
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'due',
    `tax_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `shipping_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `paid_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `purchase_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `purchases_business_id_idx`(`business_id`),
    INDEX `purchases_contact_id_idx`(`contact_id`),
    INDEX `purchases_status_idx`(`status`),
    INDEX `purchases_payment_status_idx`(`payment_status`),
    INDEX `purchases_purchase_date_idx`(`purchase_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchase_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `quantity` DECIMAL(22, 4) NOT NULL,
    `unit_cost_before` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `unit_cost_after` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `tax_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `line_total` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `purchase_lines_purchase_id_idx`(`purchase_id`),
    INDEX `purchase_lines_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_lines` ADD CONSTRAINT `purchase_lines_purchase_id_fkey` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_lines` ADD CONSTRAINT `purchase_lines_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
