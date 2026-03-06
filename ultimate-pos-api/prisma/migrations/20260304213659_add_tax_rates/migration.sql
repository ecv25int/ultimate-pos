-- CreateTable
CREATE TABLE `tax_rates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `rate` DECIMAL(5, 2) NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'percentage',
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` INTEGER NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tax_rates_business_id_idx`(`business_id`),
    INDEX `tax_rates_is_default_idx`(`is_default`),
    INDEX `tax_rates_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tax_rates` ADD CONSTRAINT `tax_rates_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
