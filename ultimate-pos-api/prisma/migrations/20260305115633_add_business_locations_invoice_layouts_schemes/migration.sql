-- CreateTable
CREATE TABLE `business_locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `landmark_city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `zip_code` VARCHAR(20) NULL,
    `mobile` VARCHAR(20) NULL,
    `alternate_number` VARCHAR(20) NULL,
    `email` VARCHAR(191) NULL,
    `website` VARCHAR(255) NULL,
    `featured_products` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `business_locations_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_layouts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `header_text` TEXT NULL,
    `footer_text` TEXT NULL,
    `invoice_heading` VARCHAR(255) NULL,
    `invoice_no_label` VARCHAR(100) NULL,
    `date_label` VARCHAR(100) NULL,
    `due_date_label` VARCHAR(100) NULL,
    `highlight_color` VARCHAR(20) NULL,
    `sub_heading_1` VARCHAR(255) NULL,
    `sub_heading_2` VARCHAR(255) NULL,
    `sub_heading_3` VARCHAR(255) NULL,
    `sub_heading_4` VARCHAR(255) NULL,
    `sub_heading_5` VARCHAR(255) NULL,
    `show_business_name` BOOLEAN NOT NULL DEFAULT true,
    `show_location_name` BOOLEAN NOT NULL DEFAULT true,
    `show_mobile_number` BOOLEAN NOT NULL DEFAULT true,
    `show_email` BOOLEAN NOT NULL DEFAULT false,
    `show_tax_1` BOOLEAN NOT NULL DEFAULT true,
    `show_tax_2` BOOLEAN NOT NULL DEFAULT false,
    `show_tax_total` BOOLEAN NOT NULL DEFAULT true,
    `show_logo` BOOLEAN NOT NULL DEFAULT true,
    `show_barcode` BOOLEAN NOT NULL DEFAULT true,
    `show_payment_methods` BOOLEAN NOT NULL DEFAULT false,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `invoice_layouts_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_schemes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `scheme_type` VARCHAR(50) NOT NULL DEFAULT 'sale',
    `prefix` VARCHAR(50) NULL,
    `invoice_layout_id` INTEGER NULL,
    `start_number` INTEGER NOT NULL DEFAULT 1,
    `total_digits` INTEGER NOT NULL DEFAULT 4,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `invoice_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `invoice_schemes_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `business_locations` ADD CONSTRAINT `business_locations_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_layouts` ADD CONSTRAINT `invoice_layouts_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_schemes` ADD CONSTRAINT `invoice_schemes_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_schemes` ADD CONSTRAINT `invoice_schemes_invoice_layout_id_fkey` FOREIGN KEY (`invoice_layout_id`) REFERENCES `invoice_layouts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
