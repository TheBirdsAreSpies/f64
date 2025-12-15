/*
  Warnings:

  - A unique constraint covering the columns `[fileHash]` on the table `Photo` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Photo` ADD COLUMN `fileHash` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Photo_fileHash_key` ON `Photo`(`fileHash`);
