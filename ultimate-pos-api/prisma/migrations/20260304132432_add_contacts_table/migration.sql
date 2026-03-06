-- CreateTable
CREATE TABLE `contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `supplier_business_name` VARCHAR(255) NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(191) NULL,
    `tax_number` VARCHAR(100) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `landmark` VARCHAR(255) NULL,
    `mobile` VARCHAR(30) NOT NULL,
    `landline` VARCHAR(30) NULL,
    `alternate_number` VARCHAR(30) NULL,
    `pay_term_number` INTEGER NULL,
    `pay_term_type` VARCHAR(10) NULL,
    `credit_limit` DECIMAL(22, 4) NULL,
    `balance` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `contact_status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `shipping_address` TEXT NULL,
    `position` VARCHAR(255) NULL,
    `created_by` INTEGER NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `contacts_business_id_idx`(`business_id`),
    INDEX `contacts_type_idx`(`type`),
    INDEX `contacts_contact_status_idx`(`contact_status`),
    INDEX `contacts_created_by_idx`(`created_by`),
    INDEX `contacts_mobile_idx`(`mobile`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
