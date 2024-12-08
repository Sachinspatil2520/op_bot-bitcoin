/*
  Warnings:

  - The primary key for the `users_assets` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "users_assets" DROP CONSTRAINT "users_assets_pkey",
ADD CONSTRAINT "users_assets_pkey" PRIMARY KEY ("user_id", "asset_id", "wallet_address");
