/*
  Warnings:

  - Added the required column `magiceden_market_data` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `magiceden_market_price` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unisat_market_data` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unisat_market_price` to the `assets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "magiceden_market_data" JSONB NOT NULL,
ADD COLUMN     "magiceden_market_price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "unisat_market_data" JSONB NOT NULL,
ADD COLUMN     "unisat_market_price" DOUBLE PRECISION NOT NULL;
