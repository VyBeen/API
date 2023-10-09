-- DropForeignKey
ALTER TABLE `player` DROP FOREIGN KEY `Player_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `playlist` DROP FOREIGN KEY `Playlist_roomId_fkey`;

-- AddForeignKey
ALTER TABLE `Playlist` ADD CONSTRAINT `Playlist_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Player` ADD CONSTRAINT `Player_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
