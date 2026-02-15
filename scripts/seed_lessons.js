const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get course ID from command line argument or use default
const courseId = process.argv[2] || '406d70fc-3bfa-4a94-8d7d-6c722aefa898';

const lessonsData = [
  {
    title: 'Introduction and Course Overview',
    slug: 'introduction-and-course-overview',
    description: 'Welcome to the course! In this lesson, we\'ll cover what you\'ll learn, the prerequisites, and how to get the most out of this course.',
    videoUrl: 'https://www.youtube.com/watch?v=example-intro',
    content: '# Introduction\n\nWelcome to this comprehensive course! We\'re excited to have you here.\n\n## What You\'ll Learn\n- Core concepts and fundamentals\n- Practical, hands-on projects\n- Best practices and industry standards\n\n## Prerequisites\n- Basic understanding of programming\n- Enthusiasm to learn!\n\nLet\'s get started!',
    duration: 600, // 10 minutes in seconds
    order: 1,
    isFree: true,
    isPublished: true,
    videoProvider: 'youtube',
  },
  {
    title: 'Setting Up Your Development Environment',
    slug: 'setting-up-development-environment',
    description: 'Learn how to set up your development environment with all the necessary tools and dependencies.',
    videoUrl: 'https://www.youtube.com/watch?v=example-setup',
    content: '# Development Environment Setup\n\n## Required Tools\n1. Code Editor (VS Code recommended)\n2. Node.js and npm\n3. Git for version control\n\n## Installation Steps\nFollow along as we install and configure each tool.\n\n## Verification\nLet\'s verify everything is installed correctly.',
    duration: 900, // 15 minutes
    order: 2,
    isFree: true,
    isPublished: true,
    videoProvider: 'youtube',
  },
  {
    title: 'Core Concepts and Fundamentals',
    slug: 'core-concepts-and-fundamentals',
    description: 'Deep dive into the core concepts that form the foundation of everything we\'ll build in this course.',
    videoUrl: 'https://www.youtube.com/watch?v=example-concepts',
    content: '# Core Concepts\n\n## Key Principles\n- Principle 1: Understanding the basics\n- Principle 2: Building on fundamentals\n- Principle 3: Applying best practices\n\n## Practical Examples\nLet\'s see these concepts in action with real-world examples.',
    duration: 1200, // 20 minutes
    order: 3,
    isFree: false,
    isPublished: true,
    videoProvider: 'youtube',
  },
  {
    title: 'Hands-On Project: Part 1',
    slug: 'hands-on-project-part-1',
    description: 'Start building your first project! We\'ll set up the project structure and implement the basic features.',
    videoUrl: 'https://www.youtube.com/watch?v=example-project1',
    content: '# Project Setup\n\n## Project Overview\nWe\'re building a real-world application that demonstrates all the concepts we\'ve learned.\n\n## Step 1: Initialize the Project\n```bash\nnpm init -y\n```\n\n## Step 2: Install Dependencies\n```bash\nnpm install express\n```\n\n## Step 3: Create Basic Structure\nLet\'s create our folder structure and initial files.',
    duration: 1800, // 30 minutes
    order: 4,
    isFree: false,
    isPublished: true,
    videoProvider: 'youtube',
    attachments: JSON.stringify([
      { name: 'starter-code.zip', url: 'https://example.com/files/starter-code.zip', type: 'file' },
      { name: 'project-resources.pdf', url: 'https://example.com/files/resources.pdf', type: 'document' }
    ]),
  },
  {
    title: 'Hands-On Project: Part 2',
    slug: 'hands-on-project-part-2',
    description: 'Continue building the project by adding advanced features and implementing business logic.',
    videoUrl: 'https://www.youtube.com/watch?v=example-project2',
    content: '# Advanced Features\n\n## Adding Functionality\nNow that we have the basic structure, let\'s add some advanced features.\n\n## Database Integration\nConnect to a database and implement CRUD operations.\n\n## Authentication\nAdd user authentication and authorization.',
    duration: 2100, // 35 minutes
    order: 5,
    isFree: false,
    isPublished: true,
    videoProvider: 'youtube',
  },
  {
    title: 'Best Practices and Optimization',
    slug: 'best-practices-and-optimization',
    description: 'Learn industry best practices and how to optimize your code for performance and maintainability.',
    videoUrl: 'https://www.youtube.com/watch?v=example-best-practices',
    content: '# Best Practices\n\n## Code Quality\n- Write clean, readable code\n- Follow naming conventions\n- Add proper comments and documentation\n\n## Performance Optimization\n- Identify bottlenecks\n- Implement caching strategies\n- Optimize database queries\n\n## Security\n- Input validation\n- Authentication best practices\n- Protecting sensitive data',
    duration: 1500, // 25 minutes
    order: 6,
    isFree: false,
    isPublished: true,
    videoProvider: 'youtube',
  },
  {
    title: 'Testing and Debugging',
    slug: 'testing-and-debugging',
    description: 'Master testing strategies and debugging techniques to build robust, reliable applications.',
    videoUrl: 'https://www.youtube.com/watch?v=example-testing',
    content: '# Testing Your Application\n\n## Unit Testing\nWrite unit tests for individual components.\n\n## Integration Testing\nTest how different parts work together.\n\n## Debugging Techniques\n- Using debugger tools\n- Reading error messages\n- Common pitfalls and solutions',
    duration: 1800, // 30 minutes
    order: 7,
    isFree: false,
    isPublished: true,
    videoProvider: 'youtube',
  },
  {
    title: 'Deployment and Production',
    slug: 'deployment-and-production',
    description: 'Learn how to deploy your application to production and manage it in a live environment.',
    videoUrl: 'https://www.youtube.com/watch?v=example-deployment',
    content: '# Going to Production\n\n## Deployment Options\n- Cloud platforms (AWS, Heroku, Vercel)\n- Traditional hosting\n- Containerization with Docker\n\n## Environment Configuration\nManage environment variables and configurations.\n\n## Monitoring and Maintenance\nSet up logging, monitoring, and alerts.',
    duration: 2400, // 40 minutes
    order: 8,
    isFree: false,
    isPublished: true,
    videoProvider: 'youtube',
  },
  {
    title: 'Advanced Topics and Next Steps',
    slug: 'advanced-topics-and-next-steps',
    description: 'Explore advanced topics and learn about next steps in your learning journey.',
    videoUrl: 'https://www.youtube.com/watch?v=example-advanced',
    content: '# Advanced Topics\n\n## Going Further\n- Advanced patterns and architectures\n- Scaling your application\n- Microservices\n\n## Continuous Learning\n- Resources for further study\n- Community and support\n- Building your portfolio',
    duration: 1200, // 20 minutes
    order: 9,
    isFree: false,
    isPublished: true,
    videoProvider: 'youtube',
  },
  {
    title: 'Course Wrap-Up and Final Project',
    slug: 'course-wrap-up-final-project',
    description: 'Review everything we\'ve learned and complete the final capstone project.',
    videoUrl: 'https://www.youtube.com/watch?v=example-final',
    content: '# Course Completion\n\n## What We\'ve Learned\nLet\'s review all the key concepts and skills you\'ve acquired.\n\n## Final Project\nPut everything together in a comprehensive final project.\n\n## Certificate of Completion\nCongratulations on completing the course!\n\n## Stay Connected\n- Join our community\n- Share your projects\n- Continue learning',
    duration: 1800, // 30 minutes
    order: 10,
    isFree: false,
    isPublished: true,
    videoProvider: 'youtube',
  },
];

async function main() {
  console.log('🌱 Starting lesson seeding...\n');
  console.log(`📚 Target Course ID: ${courseId}\n`);

  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, level: true }
  });

  if (!course) {
    console.error(`❌ Error: Course with ID "${courseId}" not found!\n`);
    console.log('Available courses:');
    const courses = await prisma.course.findMany({
      select: { id: true, title: true },
      take: 10
    });
    courses.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.title}`);
      console.log(`     ID: ${c.id}\n`);
    });
    console.log('\nUsage: node scripts/seed_lessons.js <course-id>');
    process.exit(1);
  }

  console.log(`✅ Found course: "${course.title}" (${course.level})\n`);

  // Check if lessons already exist
  const existingLessons = await prisma.lesson.findMany({
    where: { courseId }
  });

  if (existingLessons.length > 0) {
    console.log(`⚠️  Found ${existingLessons.length} existing lessons for this course.`);
    console.log('This will add more lessons. Press Ctrl+C to cancel or wait 3 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  let createdCount = 0;
  let freeCount = 0;
  let paidCount = 0;

  // Create lessons
  for (const lessonData of lessonsData) {
    try {
      const lesson = await prisma.lesson.create({
        data: {
          ...lessonData,
          courseId,
        }
      });

      if (lesson.isFree) {
        freeCount++;
        console.log(`✅ Created FREE lesson ${lesson.order}: "${lesson.title}" (${Math.floor(lesson.duration / 60)} min)`);
      } else {
        paidCount++;
        console.log(`✅ Created PAID lesson ${lesson.order}: "${lesson.title}" (${Math.floor(lesson.duration / 60)} min)`);
      }
      createdCount++;
    } catch (error) {
      console.error(`❌ Failed to create lesson: "${lessonData.title}"`, error.message);
    }
  }

  // Calculate total duration
  const totalDuration = lessonsData.reduce((sum, l) => sum + l.duration, 0);
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  console.log('\n📊 Summary:');
  console.log(`   Course: ${course.title}`);
  console.log(`   Free lessons: ${freeCount}`);
  console.log(`   Paid lessons: ${paidCount}`);
  console.log(`   Total lessons created: ${createdCount}`);
  console.log(`   Total duration: ${hours}h ${minutes}m`);
  console.log('\n✨ Lesson seeding completed!');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding lessons:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
