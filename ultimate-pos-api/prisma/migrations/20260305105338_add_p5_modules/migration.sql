-- CreateTable
CREATE TABLE `pjt_projects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `contact_id` INTEGER NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'not_started',
    `lead_id` INTEGER NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `description` TEXT NULL,
    `settings` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pjt_projects_business_id_idx`(`business_id`),
    INDEX `pjt_projects_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pjt_project_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    INDEX `pjt_project_members_project_id_idx`(`project_id`),
    INDEX `pjt_project_members_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pjt_project_tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `project_id` INTEGER NOT NULL,
    `task_id` VARCHAR(100) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NULL,
    `due_date` DATETIME(3) NULL,
    `priority` VARCHAR(20) NOT NULL DEFAULT 'low',
    `description` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'not_started',
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pjt_project_tasks_project_id_idx`(`project_id`),
    INDEX `pjt_project_tasks_business_id_idx`(`business_id`),
    INDEX `pjt_project_tasks_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pjt_project_time_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `project_id` INTEGER NOT NULL,
    `task_id` INTEGER NULL,
    `user_id` INTEGER NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NULL,
    `duration` DECIMAL(8, 2) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pjt_project_time_logs_project_id_idx`(`project_id`),
    INDEX `pjt_project_time_logs_task_id_idx`(`task_id`),
    INDEX `pjt_project_time_logs_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pjt_project_task_comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `comment` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pjt_project_task_comments_task_id_idx`(`task_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `essentials_leave_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leave_type` VARCHAR(191) NOT NULL,
    `max_leave_count` INTEGER NULL,
    `leave_count_interval` VARCHAR(20) NULL,
    `business_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `essentials_leave_types_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `essentials_leaves` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `essentials_leave_type_id` INTEGER NULL,
    `business_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `ref_no` VARCHAR(191) NULL,
    `status` VARCHAR(20) NULL,
    `reason` TEXT NULL,
    `status_note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `essentials_leaves_business_id_idx`(`business_id`),
    INDEX `essentials_leaves_user_id_idx`(`user_id`),
    INDEX `essentials_leaves_essentials_leave_type_id_idx`(`essentials_leave_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `essentials_payrolls` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `business_id` INTEGER NOT NULL,
    `ref_no` VARCHAR(191) NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `duration` DECIMAL(8, 2) NOT NULL,
    `duration_unit` VARCHAR(20) NOT NULL,
    `amount_per_unit_duration` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `allowances` TEXT NULL,
    `deductions` TEXT NULL,
    `gross_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `essentials_payrolls_business_id_idx`(`business_id`),
    INDEX `essentials_payrolls_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `essentials_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `type` VARCHAR(100) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `essentials_documents_business_id_idx`(`business_id`),
    INDEX `essentials_documents_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `essentials_reminders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `time` TIME(0) NOT NULL,
    `repeat` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `essentials_reminders_business_id_idx`(`business_id`),
    INDEX `essentials_reminders_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hms_room_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `no_of_adult` INTEGER NOT NULL,
    `no_of_child` INTEGER NOT NULL,
    `max_occupancy` INTEGER NOT NULL,
    `amenities` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `business_id` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hms_room_types_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hms_rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hms_room_type_id` INTEGER NOT NULL,
    `room_number` VARCHAR(191) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hms_rooms_hms_room_type_id_idx`(`hms_room_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hms_extras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `price_per` VARCHAR(191) NOT NULL,
    `business_id` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hms_extras_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hms_booking_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_id` INTEGER NOT NULL,
    `hms_room_id` INTEGER NOT NULL,
    `hms_room_type_id` INTEGER NOT NULL,
    `adults` INTEGER NOT NULL,
    `childrens` INTEGER NOT NULL,
    `price` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `total_price` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hms_booking_lines_transaction_id_idx`(`transaction_id`),
    INDEX `hms_booking_lines_hms_room_id_idx`(`hms_room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `location_count` INTEGER NOT NULL,
    `user_count` INTEGER NOT NULL,
    `product_count` INTEGER NOT NULL,
    `invoice_count` INTEGER NOT NULL,
    `interval` VARCHAR(20) NOT NULL,
    `interval_count` INTEGER NOT NULL,
    `trial_days` INTEGER NOT NULL,
    `price` DECIMAL(22, 4) NOT NULL,
    `created_by` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `package_id` INTEGER NOT NULL,
    `start_date` DATE NULL,
    `trial_end_date` DATE NULL,
    `end_date` DATE NULL,
    `package_price` DECIMAL(22, 4) NOT NULL,
    `package_details` LONGTEXT NOT NULL,
    `created_id` INTEGER NOT NULL,
    `paid_via` VARCHAR(191) NULL,
    `payment_transaction_id` VARCHAR(191) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'waiting',
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `subscriptions_business_id_idx`(`business_id`),
    INDEX `subscriptions_package_id_idx`(`package_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `woocommerce_sync_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `sync_type` VARCHAR(191) NOT NULL,
    `operation_type` VARCHAR(20) NULL,
    `data` LONGTEXT NULL,
    `details` LONGTEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `woocommerce_sync_logs_business_id_idx`(`business_id`),
    INDEX `woocommerce_sync_logs_sync_type_idx`(`sync_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pjt_projects` ADD CONSTRAINT `pjt_projects_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pjt_project_members` ADD CONSTRAINT `pjt_project_members_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `pjt_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pjt_project_tasks` ADD CONSTRAINT `pjt_project_tasks_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `pjt_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pjt_project_time_logs` ADD CONSTRAINT `pjt_project_time_logs_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `pjt_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pjt_project_time_logs` ADD CONSTRAINT `pjt_project_time_logs_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `pjt_project_tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pjt_project_task_comments` ADD CONSTRAINT `pjt_project_task_comments_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `pjt_project_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `essentials_leave_types` ADD CONSTRAINT `essentials_leave_types_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `essentials_leaves` ADD CONSTRAINT `essentials_leaves_essentials_leave_type_id_fkey` FOREIGN KEY (`essentials_leave_type_id`) REFERENCES `essentials_leave_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `essentials_leaves` ADD CONSTRAINT `essentials_leaves_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `essentials_payrolls` ADD CONSTRAINT `essentials_payrolls_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `essentials_documents` ADD CONSTRAINT `essentials_documents_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `essentials_reminders` ADD CONSTRAINT `essentials_reminders_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hms_room_types` ADD CONSTRAINT `hms_room_types_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hms_rooms` ADD CONSTRAINT `hms_rooms_hms_room_type_id_fkey` FOREIGN KEY (`hms_room_type_id`) REFERENCES `hms_room_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hms_extras` ADD CONSTRAINT `hms_extras_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hms_booking_lines` ADD CONSTRAINT `hms_booking_lines_hms_room_id_fkey` FOREIGN KEY (`hms_room_id`) REFERENCES `hms_rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hms_booking_lines` ADD CONSTRAINT `hms_booking_lines_hms_room_type_id_fkey` FOREIGN KEY (`hms_room_type_id`) REFERENCES `hms_room_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `woocommerce_sync_logs` ADD CONSTRAINT `woocommerce_sync_logs_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
