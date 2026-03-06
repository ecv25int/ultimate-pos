-- AlterTable
ALTER TABLE `users` ADD COLUMN `email_verification_token` VARCHAR(255) NULL,
    ADD COLUMN `is_email_verified` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `users_email_verification_token_idx` ON `users`(`email_verification_token`);
