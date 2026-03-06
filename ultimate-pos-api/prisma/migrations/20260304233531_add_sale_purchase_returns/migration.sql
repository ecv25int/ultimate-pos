-- AlterTable
ALTER TABLE `purchases` ADD COLUMN `return_of_id` INTEGER NULL,
    ADD COLUMN `type` VARCHAR(20) NOT NULL DEFAULT 'purchase';

-- AlterTable
ALTER TABLE `sales` ADD COLUMN `return_of_id` INTEGER NULL,
    ADD COLUMN `type` VARCHAR(20) NOT NULL DEFAULT 'sale';

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_return_of_id_fkey` FOREIGN KEY (`return_of_id`) REFERENCES `sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_return_of_id_fkey` FOREIGN KEY (`return_of_id`) REFERENCES `purchases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
