-- CreateTable
CREATE TABLE `journal_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `description` TEXT NULL,
    `reference_no` VARCHAR(100) NULL,
    `entry_date` DATETIME(3) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `journal_entries_business_id_idx`(`business_id`),
    INDEX `journal_entries_status_idx`(`status`),
    INDEX `journal_entries_entry_date_idx`(`entry_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journal_entry_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `journal_entry_id` INTEGER NOT NULL,
    `account_id` INTEGER NOT NULL,
    `type` VARCHAR(10) NOT NULL,
    `amount` DECIMAL(22, 4) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `journal_entry_lines_journal_entry_id_idx`(`journal_entry_id`),
    INDEX `journal_entry_lines_account_id_idx`(`account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_entry_lines` ADD CONSTRAINT `journal_entry_lines_journal_entry_id_fkey` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_entry_lines` ADD CONSTRAINT `journal_entry_lines_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
