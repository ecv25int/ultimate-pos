-- CreateTable
CREATE TABLE `group_sub_taxes` (
    `group_tax_id` INTEGER NOT NULL,
    `tax_id` INTEGER NOT NULL,

    INDEX `group_sub_taxes_group_tax_id_idx`(`group_tax_id`),
    INDEX `group_sub_taxes_tax_id_idx`(`tax_id`),
    PRIMARY KEY (`group_tax_id`, `tax_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `group_sub_taxes` ADD CONSTRAINT `group_sub_taxes_group_tax_id_fkey` FOREIGN KEY (`group_tax_id`) REFERENCES `tax_rates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_sub_taxes` ADD CONSTRAINT `group_sub_taxes_tax_id_fkey` FOREIGN KEY (`tax_id`) REFERENCES `tax_rates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
