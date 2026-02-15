const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany();
  console.log(`Found ${courses.length} courses`);
  for (const c of courses) {
    if (!c.slug) {
      const slug = c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + c.id.split('-')[0];
      await prisma.course.update({ where: { id: c.id }, data: { slug } });
      console.log(`Updated course ${c.id} with slug ${slug}`);
    }
  }

  const lessons = await prisma.lesson.findMany();
  console.log(`Found ${lessons.length} lessons`);
  for (const l of lessons) {
    if (!l.slug) {
      const slug = l.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + l.id.split('-')[0];
      await prisma.lesson.update({ where: { id: l.id }, data: { slug } });
      console.log(`Updated lesson ${l.id} with slug ${slug}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
