-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(32) NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `globalName` VARCHAR(64) NULL,
    `avatar` VARCHAR(64) NULL,
    `githubName` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tokenHash` CHAR(64) NOT NULL,
    `userId` VARCHAR(32) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ApiToken_tokenHash_key`(`tokenHash`),
    INDEX `ApiToken_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Theme` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('theme', 'snippet') NOT NULL DEFAULT 'theme',
    `description` TEXT NOT NULL,
    `version` VARCHAR(32) NULL,
    `authors` JSON NOT NULL,
    `tags` JSON NOT NULL,
    `thumbnail` VARCHAR(128) NULL,
    `contentFile` VARCHAR(128) NOT NULL,
    `source` TEXT NULL,
    `guildName` VARCHAR(100) NULL,
    `guildSnowflake` VARCHAR(32) NULL,
    `guildInvite` VARCHAR(128) NULL,
    `guildAvatarHash` VARCHAR(64) NULL,
    `requiresThemeAttributes` BOOLEAN NOT NULL DEFAULT false,
    `downloads` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `submitterId` VARCHAR(32) NULL,
    `releaseDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUpdated` DATETIME(3) NULL,

    UNIQUE INDEX `Theme_name_key`(`name`),
    INDEX `Theme_status_idx`(`status`),
    INDEX `Theme_submitterId_idx`(`submitterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Like` (
    `userId` VARCHAR(32) NOT NULL,
    `themeId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Like_themeId_idx`(`themeId`),
    PRIMARY KEY (`userId`, `themeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ApiToken` ADD CONSTRAINT `ApiToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Theme` ADD CONSTRAINT `Theme_submitterId_fkey` FOREIGN KEY (`submitterId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_themeId_fkey` FOREIGN KEY (`themeId`) REFERENCES `Theme`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

