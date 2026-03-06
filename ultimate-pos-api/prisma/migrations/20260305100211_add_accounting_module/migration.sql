-- CreateTable
CREATE TABLE `account_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `root_type` VARCHAR(20) NOT NULL,
    `parent_account_type_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `account_types_business_id_idx`(`business_id`),
    INDEX `account_types_parent_account_type_id_idx`(`parent_account_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `account_type_id` INTEGER NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `account_number` VARCHAR(50) NOT NULL,
    `note` TEXT NULL,
    `is_closed` BOOLEAN NOT NULL DEFAULT false,
    `account_details` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `accounts_business_id_idx`(`business_id`),
    INDEX `accounts_account_type_id_idx`(`account_type_id`),
    INDEX `accounts_is_closed_idx`(`is_closed`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `type` VARCHAR(10) NOT NULL,
    `sub_type` VARCHAR(30) NULL,
    `amount` DECIMAL(22, 4) NOT NULL,
    `reference_no` VARCHAR(100) NULL,
    `operation_date` DATETIME(3) NOT NULL,
    `note` TEXT NULL,
    `linked_transaction_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `account_transactions_account_id_idx`(`account_id`),
    INDEX `account_transactions_type_idx`(`type`),
    INDEX `account_transactions_operation_date_idx`(`operation_date`),
    INDEX `account_transactions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `account_types` ADD CONSTRAINT `account_types_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_types` ADD CONSTRAINT `account_types_parent_account_type_id_fkey` FOREIGN KEY (`parent_account_type_id`) REFERENCES `account_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_account_type_id_fkey` FOREIGN KEY (`account_type_id`) REFERENCES `account_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_transactions` ADD CONSTRAINT `account_transactions_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
