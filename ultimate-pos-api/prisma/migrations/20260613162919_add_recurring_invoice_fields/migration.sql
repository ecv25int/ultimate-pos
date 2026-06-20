-- AlterTable
ALTER TABLE `sales` ADD COLUMN `is_recurring` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `recur_interval` DECIMAL(22, 4) NULL,
    ADD COLUMN `recur_interval_type` VARCHAR(20) NULL,
    ADD COLUMN `recur_parent_id` INTEGER NULL,
    ADD COLUMN `recur_repetitions` INTEGER NULL,
    ADD COLUMN `recur_stopped_on` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_recur_parent_id_fkey` FOREIGN KEY (`recur_parent_id`) REFERENCES `sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
