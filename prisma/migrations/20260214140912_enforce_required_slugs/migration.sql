/*
  Warnings:

  - Made the column `slug` on table `Course` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `Lesson` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "LessonProgress" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "updatedAt" DROP DEFAULT;
