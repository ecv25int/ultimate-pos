-- AlterTable
ALTER TABLE `stock_adjustment_lines` ADD COLUMN `actual_qty` DECIMAL(22, 4) NULL,
    ADD COLUMN `reason` VARCHAR(50) NULL,
    ADD COLUMN `system_qty` DECIMAL(22, 4) NULL;
