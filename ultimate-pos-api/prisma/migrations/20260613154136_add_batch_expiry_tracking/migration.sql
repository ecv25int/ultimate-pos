-- AlterTable
ALTER TABLE `purchase_lines` ADD COLUMN `batch_number` VARCHAR(50) NULL,
    ADD COLUMN `expiry_date` DATETIME(3) NULL,
    ADD COLUMN `quantity_adjusted` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    ADD COLUMN `quantity_sold` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    ADD COLUMN `variation_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `transaction_sell_lines_purchase_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sell_line_id` INTEGER NOT NULL,
    `purchase_line_id` INTEGER NOT NULL,
    `quantity` DECIMAL(22, 4) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `transaction_sell_lines_purchase_lines_sell_line_id_idx`(`sell_line_id`),
    INDEX `transaction_sell_lines_purchase_lines_purchase_line_id_idx`(`purchase_line_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `purchase_lines_variation_id_idx` ON `purchase_lines`(`variation_id`);

-- CreateIndex
CREATE INDEX `purchase_lines_batch_number_idx` ON `purchase_lines`(`batch_number`);

-- CreateIndex
CREATE INDEX `purchase_lines_expiry_date_idx` ON `purchase_lines`(`expiry_date`);

-- AddForeignKey
ALTER TABLE `purchase_lines` ADD CONSTRAINT `purchase_lines_variation_id_fkey` FOREIGN KEY (`variation_id`) REFERENCES `variations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_sell_lines_purchase_lines` ADD CONSTRAINT `transaction_sell_lines_purchase_lines_sell_line_id_fkey` FOREIGN KEY (`sell_line_id`) REFERENCES `sale_lines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_sell_lines_purchase_lines` ADD CONSTRAINT `transaction_sell_lines_purchase_lines_purchase_line_id_fkey` FOREIGN KEY (`purchase_line_id`) REFERENCES `purchase_lines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
