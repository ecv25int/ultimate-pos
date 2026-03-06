-- CreateTable
CREATE TABLE `mfg_ingredient_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `mfg_ingredient_groups_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mfg_recipes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `variation_id` INTEGER NOT NULL,
    `instructions` TEXT NULL,
    `waste_percent` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `ingredients_cost` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `extra_cost` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `total_quantity` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `final_price` DECIMAL(22, 4) NOT NULL,
    `sub_unit_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `mfg_recipes_product_id_idx`(`product_id`),
    INDEX `mfg_recipes_variation_id_idx`(`variation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mfg_recipe_ingredients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mfg_recipe_id` INTEGER NOT NULL,
    `variation_id` INTEGER NOT NULL,
    `quantity` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `sub_unit_id` INTEGER NULL,
    `mfg_ingredient_group_id` INTEGER NULL,
    `waste_percent` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `mfg_recipe_ingredients_mfg_recipe_id_idx`(`mfg_recipe_id`),
    INDEX `mfg_recipe_ingredients_variation_id_idx`(`variation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repair_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `color` VARCHAR(20) NULL,
    `sort_order` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `repair_statuses_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repair_device_models` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `repair_checklist` TEXT NULL,
    `brand_id` INTEGER NULL,
    `device_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `repair_device_models_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repair_job_sheets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `location_id` INTEGER NULL,
    `contact_id` INTEGER NOT NULL,
    `job_sheet_no` VARCHAR(100) NOT NULL,
    `service_type` VARCHAR(20) NOT NULL DEFAULT 'carry_in',
    `pick_up_on_site_addr` TEXT NULL,
    `brand_id` INTEGER NULL,
    `device_id` INTEGER NULL,
    `device_model_id` INTEGER NULL,
    `checklist` TEXT NULL,
    `security_pwd` VARCHAR(255) NULL,
    `security_pattern` VARCHAR(255) NULL,
    `serial_no` VARCHAR(255) NOT NULL,
    `status_id` INTEGER NOT NULL,
    `delivery_date` DATETIME(3) NULL,
    `product_configuration` TEXT NULL,
    `defects` TEXT NULL,
    `product_condition` TEXT NULL,
    `service_staff` INTEGER NULL,
    `comment_by_ss` TEXT NULL,
    `estimated_cost` DECIMAL(22, 4) NULL,
    `parts` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `repair_job_sheets_business_id_idx`(`business_id`),
    INDEX `repair_job_sheets_contact_id_idx`(`contact_id`),
    INDEX `repair_job_sheets_status_id_idx`(`status_id`),
    INDEX `repair_job_sheets_job_sheet_no_idx`(`job_sheet_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `asset_code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(22, 4) NOT NULL,
    `model` VARCHAR(255) NULL,
    `serial_no` VARCHAR(255) NULL,
    `category_id` INTEGER NULL,
    `location_id` INTEGER NULL,
    `purchase_date` DATETIME(3) NULL,
    `purchase_type` VARCHAR(100) NULL,
    `unit_price` DECIMAL(22, 4) NOT NULL,
    `depreciation` DECIMAL(22, 4) NULL,
    `is_allocatable` BOOLEAN NOT NULL DEFAULT false,
    `description` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `assets_business_id_idx`(`business_id`),
    INDEX `assets_asset_code_idx`(`asset_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `asset_id` INTEGER NULL,
    `transaction_type` VARCHAR(50) NOT NULL,
    `ref_no` VARCHAR(100) NOT NULL,
    `receiver` INTEGER NULL,
    `quantity` DECIMAL(22, 4) NOT NULL,
    `transaction_datetime` DATETIME(3) NOT NULL,
    `allocated_upto` DATETIME(3) NULL,
    `reason` TEXT NULL,
    `parent_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `asset_transactions_business_id_idx`(`business_id`),
    INDEX `asset_transactions_asset_id_idx`(`asset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_warranties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asset_id` INTEGER NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `additional_cost` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `additional_note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `asset_warranties_asset_id_idx`(`asset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_maintenances` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `asset_id` INTEGER NOT NULL,
    `maitenance_id` VARCHAR(100) NULL,
    `status` VARCHAR(50) NULL,
    `priority` VARCHAR(50) NULL,
    `created_by` INTEGER NOT NULL,
    `assigned_to` INTEGER NULL,
    `details` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `asset_maintenances_business_id_idx`(`business_id`),
    INDEX `asset_maintenances_asset_id_idx`(`asset_id`),
    INDEX `asset_maintenances_status_idx`(`status`),
    INDEX `asset_maintenances_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mfg_ingredient_groups` ADD CONSTRAINT `mfg_ingredient_groups_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mfg_recipe_ingredients` ADD CONSTRAINT `mfg_recipe_ingredients_mfg_recipe_id_fkey` FOREIGN KEY (`mfg_recipe_id`) REFERENCES `mfg_recipes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mfg_recipe_ingredients` ADD CONSTRAINT `mfg_recipe_ingredients_mfg_ingredient_group_id_fkey` FOREIGN KEY (`mfg_ingredient_group_id`) REFERENCES `mfg_ingredient_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_statuses` ADD CONSTRAINT `repair_statuses_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_device_models` ADD CONSTRAINT `repair_device_models_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_job_sheets` ADD CONSTRAINT `repair_job_sheets_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_job_sheets` ADD CONSTRAINT `repair_job_sheets_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_job_sheets` ADD CONSTRAINT `repair_job_sheets_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `repair_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_job_sheets` ADD CONSTRAINT `repair_job_sheets_device_model_id_fkey` FOREIGN KEY (`device_model_id`) REFERENCES `repair_device_models`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_transactions` ADD CONSTRAINT `asset_transactions_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_transactions` ADD CONSTRAINT `asset_transactions_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_transactions` ADD CONSTRAINT `asset_transactions_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `asset_transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_warranties` ADD CONSTRAINT `asset_warranties_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_maintenances` ADD CONSTRAINT `asset_maintenances_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
