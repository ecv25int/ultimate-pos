-- CreateTable
CREATE TABLE `stock_adjustments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `location_id` INTEGER NULL,
    `reference_no` VARCHAR(100) NULL,
    `adjustment_type` VARCHAR(30) NOT NULL DEFAULT 'normal',
    `total_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'received',
    `finalised` BOOLEAN NOT NULL DEFAULT false,
    `finalised_at` DATETIME(3) NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `stock_adjustments_business_id_idx`(`business_id`),
    INDEX `stock_adjustments_location_id_idx`(`location_id`),
    INDEX `stock_adjustments_created_by_idx`(`created_by`),
    INDEX `stock_adjustments_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_adjustment_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adjustment_id` INTEGER NOT NULL,
    `variation_id` INTEGER NULL,
    `quantity` DECIMAL(22, 4) NOT NULL,
    `unit_price` DECIMAL(22, 4) NOT NULL DEFAULT 0,

    INDEX `stock_adjustment_lines_adjustment_id_idx`(`adjustment_id`),
    INDEX `stock_adjustment_lines_variation_id_idx`(`variation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barcode_labels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `sticker_type` VARCHAR(50) NOT NULL DEFAULT 'name_price',
    `barcode_type` VARCHAR(20) NOT NULL DEFAULT 'C128',
    `width` DECIMAL(8, 2) NULL,
    `height` DECIMAL(8, 2) NULL,
    `paper_width` DECIMAL(8, 2) NULL,
    `paper_height` DECIMAL(8, 2) NULL,
    `font_size` INTEGER NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `barcode_labels_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `business_locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustment_lines` ADD CONSTRAINT `stock_adjustment_lines_adjustment_id_fkey` FOREIGN KEY (`adjustment_id`) REFERENCES `stock_adjustments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustment_lines` ADD CONSTRAINT `stock_adjustment_lines_variation_id_fkey` FOREIGN KEY (`variation_id`) REFERENCES `variations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barcode_labels` ADD CONSTRAINT `barcode_labels_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
