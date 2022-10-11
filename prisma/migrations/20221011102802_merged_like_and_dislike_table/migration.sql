/*
  Warnings:

  - You are about to drop the `Dislike` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Like` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Dislike";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Like";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "LikeDislike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "like" BOOLEAN NOT NULL,
    "dislike" BOOLEAN NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "LikeDislike_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LikeDislike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LikeDislike_userId_key" ON "LikeDislike"("userId");
