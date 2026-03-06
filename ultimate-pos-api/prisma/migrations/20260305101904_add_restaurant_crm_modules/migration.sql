-- CreateTable
CREATE TABLE `res_tables` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `location_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'available',
    `capacity` INTEGER NOT NULL DEFAULT 4,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `res_tables_business_id_idx`(`business_id`),
    INDEX `res_tables_location_id_idx`(`location_id`),
    INDEX `res_tables_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `location_id` INTEGER NOT NULL,
    `contact_id` INTEGER NOT NULL,
    `table_id` INTEGER NULL,
    `waiter_id` INTEGER NULL,
    `correspondent_id` INTEGER NULL,
    `booking_start` DATETIME(3) NOT NULL,
    `booking_end` DATETIME(3) NOT NULL,
    `booking_status` VARCHAR(20) NOT NULL DEFAULT 'booked',
    `booking_note` TEXT NULL,
    `guest_count` INTEGER NOT NULL DEFAULT 1,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `bookings_business_id_idx`(`business_id`),
    INDEX `bookings_location_id_idx`(`location_id`),
    INDEX `bookings_contact_id_idx`(`contact_id`),
    INDEX `bookings_booking_start_idx`(`booking_start`),
    INDEX `bookings_booking_status_idx`(`booking_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_campaigns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `campaign_type` VARCHAR(10) NOT NULL DEFAULT 'email',
    `subject` VARCHAR(255) NULL,
    `email_body` TEXT NULL,
    `sms_body` TEXT NULL,
    `sent_on` DATETIME(3) NULL,
    `contact_ids` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `crm_campaigns_business_id_idx`(`business_id`),
    INDEX `crm_campaigns_campaign_type_idx`(`campaign_type`),
    INDEX `crm_campaigns_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `contact_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `start_datetime` DATETIME(3) NOT NULL,
    `end_datetime` DATETIME(3) NOT NULL,
    `description` TEXT NULL,
    `schedule_type` VARCHAR(20) NOT NULL DEFAULT 'meeting',
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `crm_schedules_business_id_idx`(`business_id`),
    INDEX `crm_schedules_contact_id_idx`(`contact_id`),
    INDEX `crm_schedules_schedule_type_idx`(`schedule_type`),
    INDEX `crm_schedules_start_datetime_idx`(`start_datetime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_call_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `contact_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `call_type` VARCHAR(20) NOT NULL DEFAULT 'outbound',
    `mobile_number` VARCHAR(30) NOT NULL,
    `start_time` DATETIME(3) NULL,
    `end_time` DATETIME(3) NULL,
    `duration` INTEGER NULL,
    `note` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `crm_call_logs_business_id_idx`(`business_id`),
    INDEX `crm_call_logs_contact_id_idx`(`contact_id`),
    INDEX `crm_call_logs_call_type_idx`(`call_type`),
    INDEX `crm_call_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `res_tables` ADD CONSTRAINT `res_tables_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_table_id_fkey` FOREIGN KEY (`table_id`) REFERENCES `res_tables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_campaigns` ADD CONSTRAINT `crm_campaigns_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_schedules` ADD CONSTRAINT `crm_schedules_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_schedules` ADD CONSTRAINT `crm_schedules_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_call_logs` ADD CONSTRAINT `crm_call_logs_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_call_logs` ADD CONSTRAINT `crm_call_logs_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
