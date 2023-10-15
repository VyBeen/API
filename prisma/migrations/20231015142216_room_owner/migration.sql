/*
  Warnings:

  - A unique constraint covering the columns `[ownerId]` on the table `Room` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `room` ADD COLUMN `ownerId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Room_ownerId_key` ON `Room`(`ownerId`);

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
