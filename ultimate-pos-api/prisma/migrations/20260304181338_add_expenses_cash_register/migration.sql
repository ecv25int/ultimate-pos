-- CreateTable
CREATE TABLE `expense_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `expense_categories_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `expense_category_id` INTEGER NULL,
    `ref_no` VARCHAR(60) NULL,
    `amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `tax_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `expense_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `expenses_business_id_idx`(`business_id`),
    INDEX `expenses_expense_category_id_idx`(`expense_category_id`),
    INDEX `expenses_expense_date_idx`(`expense_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_registers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `status` VARCHAR(10) NOT NULL DEFAULT 'open',
    `opening_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `closing_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `open_note` TEXT NULL,
    `closing_note` TEXT NULL,
    `opened_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `cash_registers_business_id_idx`(`business_id`),
    INDEX `cash_registers_user_id_idx`(`user_id`),
    INDEX `cash_registers_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_register_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cash_register_id` INTEGER NOT NULL,
    `transaction_type` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(22, 4) NOT NULL,
    `note` TEXT NULL,
    `reference_no` VARCHAR(100) NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `cash_register_transactions_cash_register_id_idx`(`cash_register_id`),
    INDEX `cash_register_transactions_transaction_type_idx`(`transaction_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `expense_categories` ADD CONSTRAINT `expense_categories_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_expense_category_id_fkey` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_registers` ADD CONSTRAINT `cash_registers_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_register_transactions` ADD CONSTRAINT `cash_register_transactions_cash_register_id_fkey` FOREIGN KEY (`cash_register_id`) REFERENCES `cash_registers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
