-- AlterTable
ALTER TABLE `users` ADD COLUMN `password_reset_expires` DATETIME(3) NULL,
    ADD COLUMN `password_reset_token` VARCHAR(255) NULL;

-- CreateIndex
CREATE INDEX `users_password_reset_token_idx` ON `users`(`password_reset_token`);
