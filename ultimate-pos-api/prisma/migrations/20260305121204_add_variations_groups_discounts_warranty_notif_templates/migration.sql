-- AlterTable
ALTER TABLE `contacts` ADD COLUMN `customer_group_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `warranty_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `sale_lines` ADD COLUMN `variation_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `sales` ADD COLUMN `selling_price_group_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `variation_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `variation_templates_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `variation_value_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `variation_template_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `variation_value_templates_variation_template_id_idx`(`variation_template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_variations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `is_dummy` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_variations_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `variations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `product_variation_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `sub_sku` VARCHAR(255) NULL,
    `default_purchase_price` DECIMAL(22, 4) NULL,
    `dpp_inc_tax` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `profit_percent` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `default_sell_price` DECIMAL(22, 4) NULL,
    `sell_price_inc_tax` DECIMAL(22, 4) NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `variations_product_id_idx`(`product_id`),
    INDEX `variations_product_variation_id_idx`(`product_variation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `variation_location_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `product_variation_id` INTEGER NOT NULL,
    `variation_id` INTEGER NOT NULL,
    `location_id` INTEGER NOT NULL,
    `qty_available` DECIMAL(22, 4) NOT NULL DEFAULT 0,

    INDEX `variation_location_details_product_id_idx`(`product_id`),
    INDEX `variation_location_details_variation_id_idx`(`variation_id`),
    INDEX `variation_location_details_location_id_idx`(`location_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `variation_group_prices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `variation_id` INTEGER NOT NULL,
    `price_group_id` INTEGER NOT NULL,
    `price_inc_tax` DECIMAL(22, 4) NOT NULL,

    INDEX `variation_group_prices_variation_id_idx`(`variation_id`),
    INDEX `variation_group_prices_price_group_id_idx`(`price_group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `amount` FLOAT NOT NULL DEFAULT 0,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `customer_groups_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `selling_price_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `selling_price_groups_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `brand_id` INTEGER NULL,
    `category_id` INTEGER NULL,
    `location_id` INTEGER NULL,
    `priority` INTEGER NULL,
    `discount_type` VARCHAR(20) NULL,
    `discount_amount` DECIMAL(22, 4) NOT NULL DEFAULT 0,
    `starts_at` DATETIME(3) NULL,
    `ends_at` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `applicable_in_spg` BOOLEAN NOT NULL DEFAULT false,
    `applicable_in_cg` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `discounts_business_id_idx`(`business_id`),
    INDEX `discounts_location_id_idx`(`location_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warranties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `duration` INTEGER NOT NULL,
    `duration_type` ENUM('days', 'months', 'years') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `warranties_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sell_line_warranties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sale_line_id` INTEGER NOT NULL,
    `warranty_id` INTEGER NOT NULL,

    INDEX `sell_line_warranties_sale_line_id_idx`(`sale_line_id`),
    INDEX `sell_line_warranties_warranty_id_idx`(`warranty_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `template_for` VARCHAR(100) NOT NULL,
    `email_body` TEXT NULL,
    `sms_body` TEXT NULL,
    `subject` VARCHAR(255) NULL,
    `auto_send` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notification_templates_business_id_idx`(`business_id`),
    INDEX `notification_templates_template_for_idx`(`template_for`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `contacts_customer_group_id_idx` ON `contacts`(`customer_group_id`);

-- CreateIndex
CREATE INDEX `products_warranty_id_idx` ON `products`(`warranty_id`);

-- CreateIndex
CREATE INDEX `sale_lines_variation_id_idx` ON `sale_lines`(`variation_id`);

-- CreateIndex
CREATE INDEX `sales_selling_price_group_id_idx` ON `sales`(`selling_price_group_id`);

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_warranty_id_fkey` FOREIGN KEY (`warranty_id`) REFERENCES `warranties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_customer_group_id_fkey` FOREIGN KEY (`customer_group_id`) REFERENCES `customer_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_selling_price_group_id_fkey` FOREIGN KEY (`selling_price_group_id`) REFERENCES `selling_price_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_lines` ADD CONSTRAINT `sale_lines_variation_id_fkey` FOREIGN KEY (`variation_id`) REFERENCES `variations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mfg_recipes` ADD CONSTRAINT `mfg_recipes_variation_id_fkey` FOREIGN KEY (`variation_id`) REFERENCES `variations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mfg_recipe_ingredients` ADD CONSTRAINT `mfg_recipe_ingredients_variation_id_fkey` FOREIGN KEY (`variation_id`) REFERENCES `variations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variation_templates` ADD CONSTRAINT `variation_templates_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variation_value_templates` ADD CONSTRAINT `variation_value_templates_variation_template_id_fkey` FOREIGN KEY (`variation_template_id`) REFERENCES `variation_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variations` ADD CONSTRAINT `product_variations_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variations` ADD CONSTRAINT `variations_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variations` ADD CONSTRAINT `variations_product_variation_id_fkey` FOREIGN KEY (`product_variation_id`) REFERENCES `product_variations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variation_location_details` ADD CONSTRAINT `variation_location_details_variation_id_fkey` FOREIGN KEY (`variation_id`) REFERENCES `variations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variation_location_details` ADD CONSTRAINT `variation_location_details_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `business_locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variation_group_prices` ADD CONSTRAINT `variation_group_prices_variation_id_fkey` FOREIGN KEY (`variation_id`) REFERENCES `variations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variation_group_prices` ADD CONSTRAINT `variation_group_prices_price_group_id_fkey` FOREIGN KEY (`price_group_id`) REFERENCES `selling_price_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_groups` ADD CONSTRAINT `customer_groups_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `selling_price_groups` ADD CONSTRAINT `selling_price_groups_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discounts` ADD CONSTRAINT `discounts_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discounts` ADD CONSTRAINT `discounts_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `business_locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warranties` ADD CONSTRAINT `warranties_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sell_line_warranties` ADD CONSTRAINT `sell_line_warranties_sale_line_id_fkey` FOREIGN KEY (`sale_line_id`) REFERENCES `sale_lines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sell_line_warranties` ADD CONSTRAINT `sell_line_warranties_warranty_id_fkey` FOREIGN KEY (`warranty_id`) REFERENCES `warranties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_templates` ADD CONSTRAINT `notification_templates_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
