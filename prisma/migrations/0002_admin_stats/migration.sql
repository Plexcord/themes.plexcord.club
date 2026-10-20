-- AlterTable
ALTER TABLE `Theme` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `DailyDownload` (
    `day` DATE NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`day`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- Existing themes: use their release date instead of the migration time
UPDATE `Theme` SET `createdAt` = `releaseDate`;
