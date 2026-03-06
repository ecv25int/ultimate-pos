-- AlterTable
ALTER TABLE `users` ADD COLUMN `locale` VARCHAR(10) NOT NULL DEFAULT 'en';

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `user_id` INTEGER NULL,
    `action` VARCHAR(20) NOT NULL,
    `entity` VARCHAR(50) NOT NULL,
    `entity_id` INTEGER NULL,
    `meta` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_business_id_idx`(`business_id`),
    INDEX `audit_logs_business_id_entity_idx`(`business_id`, `entity`),
    INDEX `audit_logs_business_id_created_at_idx`(`business_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
