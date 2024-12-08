-- CreateTable
CREATE TABLE "users_assets" (
    "user_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_assets_pkey" PRIMARY KEY ("user_id","asset_id")
);
