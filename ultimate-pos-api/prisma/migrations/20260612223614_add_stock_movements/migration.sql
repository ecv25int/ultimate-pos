-- CreateTable
CREATE TABLE `stock_movements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `variation_id` INTEGER NOT NULL,
    `location_id` INTEGER NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `quantity` DECIMAL(22, 4) NOT NULL,
    `reference_no` VARCHAR(100) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_business_id_idx`(`business_id`),
    INDEX `stock_movements_variation_id_idx`(`variation_id`),
    INDEX `stock_movements_location_id_idx`(`location_id`),
    INDEX `stock_movements_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_variation_id_fkey` FOREIGN KEY (`variation_id`) REFERENCES `variations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `business_locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
