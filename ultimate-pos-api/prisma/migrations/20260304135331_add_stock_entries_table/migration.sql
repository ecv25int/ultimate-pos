-- CreateTable
CREATE TABLE `stock_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `entry_type` VARCHAR(30) NOT NULL,
    `quantity` DECIMAL(22, 4) NOT NULL,
    `unit_cost` DECIMAL(22, 4) NULL,
    `reference_no` VARCHAR(100) NULL,
    `note` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `stock_entries_business_id_idx`(`business_id`),
    INDEX `stock_entries_product_id_idx`(`product_id`),
    INDEX `stock_entries_entry_type_idx`(`entry_type`),
    INDEX `stock_entries_created_by_idx`(`created_by`),
    INDEX `stock_entries_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stock_entries` ADD CONSTRAINT `stock_entries_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_entries` ADD CONSTRAINT `stock_entries_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
