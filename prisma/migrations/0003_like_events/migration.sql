-- CreateTable
CREATE TABLE `LikeEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(32) NOT NULL,
    `themeId` INTEGER NOT NULL,
    `liked` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LikeEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LikeEvent` ADD CONSTRAINT `LikeEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LikeEvent` ADD CONSTRAINT `LikeEvent_themeId_fkey` FOREIGN KEY (`themeId`) REFERENCES `Theme`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- Existing likes become "liked" events so the history starts complete
INSERT INTO `LikeEvent` (`userId`, `themeId`, `liked`, `createdAt`) SELECT `userId`, `themeId`, true, `createdAt` FROM `Like`;
