-- CreateTable
CREATE TABLE `scheduled_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `report_type` VARCHAR(50) NOT NULL,
    `frequency` VARCHAR(20) NOT NULL,
    `recipients` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_run_at` DATETIME(3) NULL,
    `next_run_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `scheduled_reports_business_id_idx`(`business_id`),
    INDEX `scheduled_reports_business_id_is_active_idx`(`business_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `scheduled_reports` ADD CONSTRAINT `scheduled_reports_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
