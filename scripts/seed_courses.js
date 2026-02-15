const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const coursesData = [
  // FREE COURSES (5)
  {
    title: 'Introduction to Web Development',
    slug: 'introduction-to-web-development',
    description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript. Perfect for beginners who want to start their journey in web development. This comprehensive course covers everything from basic syntax to building your first interactive website.',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    videoUrl: 'https://www.youtube.com/watch?v=example1',
    price: 0,
    level: 'BEGINNER',
    category: 'Web Development',
    tags: ['HTML', 'CSS', 'JavaScript', 'Frontend'],
    duration: '8 hours',
    status: 'PUBLISHED',
    averageRating: 4.5,
    totalRatings: 125,
    enrollmentCount: 450,
    publishedAt: new Date('2024-01-15'),
  },
  {
    title: 'Git and GitHub Essentials',
    slug: 'git-and-github-essentials',
    description: 'Master version control with Git and collaboration with GitHub. Learn branching, merging, pull requests, and best practices for team collaboration. Essential skills for any developer.',
    thumbnail: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800',
    videoUrl: 'https://www.youtube.com/watch?v=example2',
    price: 0,
    level: 'BEGINNER',
    category: 'Development Tools',
    tags: ['Git', 'GitHub', 'Version Control', 'Collaboration'],
    duration: '5 hours',
    status: 'PUBLISHED',
    averageRating: 4.7,
    totalRatings: 89,
    enrollmentCount: 320,
    publishedAt: new Date('2024-02-01'),
  },
  {
    title: 'Python Programming Basics',
    slug: 'python-programming-basics',
    description: 'Start your programming journey with Python, one of the most popular and beginner-friendly languages. Learn variables, functions, loops, and object-oriented programming concepts.',
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
    videoUrl: 'https://www.youtube.com/watch?v=example3',
    price: 0,
    level: 'BEGINNER',
    category: 'Programming',
    tags: ['Python', 'Programming', 'OOP', 'Basics'],
    duration: '10 hours',
    status: 'PUBLISHED',
    averageRating: 4.6,
    totalRatings: 203,
    enrollmentCount: 580,
    publishedAt: new Date('2024-01-20'),
  },
  {
    title: 'Responsive Web Design Fundamentals',
    slug: 'responsive-web-design-fundamentals',
    description: 'Create beautiful, mobile-friendly websites that work on any device. Learn CSS Grid, Flexbox, media queries, and modern responsive design techniques.',
    thumbnail: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800',
    videoUrl: 'https://www.youtube.com/watch?v=example4',
    price: 0,
    level: 'BEGINNER',
    category: 'Web Design',
    tags: ['CSS', 'Responsive Design', 'Mobile', 'Flexbox'],
    duration: '6 hours',
    status: 'PUBLISHED',
    averageRating: 4.4,
    totalRatings: 156,
    enrollmentCount: 410,
    publishedAt: new Date('2024-02-10'),
  },
  {
    title: 'Introduction to Databases with SQL',
    slug: 'introduction-to-databases-with-sql',
    description: 'Understand database fundamentals and master SQL queries. Learn to create, read, update, and delete data, work with joins, and optimize your queries for better performance.',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
    videoUrl: 'https://www.youtube.com/watch?v=example5',
    price: 0,
    level: 'BEGINNER',
    category: 'Database',
    tags: ['SQL', 'Database', 'PostgreSQL', 'MySQL'],
    duration: '7 hours',
    status: 'PUBLISHED',
    averageRating: 4.8,
    totalRatings: 178,
    enrollmentCount: 495,
    publishedAt: new Date('2024-01-25'),
  },
  
  // PAID COURSES (5)
  {
    title: 'Advanced React and Next.js Masterclass',
    slug: 'advanced-react-and-nextjs-masterclass',
    description: 'Take your React skills to the next level with advanced patterns, performance optimization, and Next.js 14. Build production-ready applications with server components, streaming, and more.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    videoUrl: 'https://www.youtube.com/watch?v=example6',
    price: 49.99,
    level: 'ADVANCED',
    category: 'Web Development',
    tags: ['React', 'Next.js', 'TypeScript', 'Advanced'],
    duration: '25 hours',
    status: 'PUBLISHED',
    averageRating: 4.9,
    totalRatings: 342,
    enrollmentCount: 1250,
    publishedAt: new Date('2024-01-10'),
  },
  {
    title: 'Full-Stack Development with Node.js and MongoDB',
    slug: 'fullstack-development-nodejs-mongodb',
    description: 'Build complete web applications from scratch using Node.js, Express, MongoDB, and React. Learn authentication, API design, database modeling, deployment, and best practices.',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
    videoUrl: 'https://www.youtube.com/watch?v=example7',
    price: 59.99,
    level: 'INTERMEDIATE',
    category: 'Web Development',
    tags: ['Node.js', 'MongoDB', 'Express', 'Full-Stack'],
    duration: '30 hours',
    status: 'PUBLISHED',
    averageRating: 4.7,
    totalRatings: 287,
    enrollmentCount: 890,
    publishedAt: new Date('2024-02-05'),
  },
  {
    title: 'Machine Learning with Python and TensorFlow',
    slug: 'machine-learning-python-tensorflow',
    description: 'Dive into machine learning and AI. Learn neural networks, deep learning, computer vision, and natural language processing. Build real-world ML models and deploy them.',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
    videoUrl: 'https://www.youtube.com/watch?v=example8',
    price: 79.99,
    level: 'ADVANCED',
    category: 'Data Science',
    tags: ['Machine Learning', 'Python', 'TensorFlow', 'AI'],
    duration: '40 hours',
    status: 'PUBLISHED',
    averageRating: 4.8,
    totalRatings: 412,
    enrollmentCount: 1580,
    publishedAt: new Date('2024-01-05'),
  },
  {
    title: 'DevOps and Cloud Architecture with AWS',
    slug: 'devops-cloud-architecture-aws',
    description: 'Master DevOps practices and AWS cloud services. Learn CI/CD, Docker, Kubernetes, infrastructure as code with Terraform, monitoring, and scaling applications in the cloud.',
    thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800',
    videoUrl: 'https://www.youtube.com/watch?v=example9',
    price: 69.99,
    level: 'INTERMEDIATE',
    category: 'DevOps',
    tags: ['AWS', 'DevOps', 'Docker', 'Kubernetes'],
    duration: '35 hours',
    status: 'PUBLISHED',
    averageRating: 4.6,
    totalRatings: 198,
    enrollmentCount: 720,
    publishedAt: new Date('2024-02-15'),
  },
  {
    title: 'Mobile App Development with React Native',
    slug: 'mobile-app-development-react-native',
    description: 'Build native iOS and Android apps using React Native. Learn navigation, state management, native modules, animations, and how to publish your apps to the App Store and Google Play.',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
    videoUrl: 'https://www.youtube.com/watch?v=example10',
    price: 54.99,
    level: 'INTERMEDIATE',
    category: 'Mobile Development',
    tags: ['React Native', 'Mobile', 'iOS', 'Android'],
    duration: '28 hours',
    status: 'PUBLISHED',
    averageRating: 4.5,
    totalRatings: 234,
    enrollmentCount: 650,
    publishedAt: new Date('2024-01-30'),
  },
];

async function main() {
  console.log('🌱 Starting course seeding...\n');

  // First, check if we have any instructors
  let instructor = await prisma.user.findFirst({
    where: { role: 'INSTRUCTOR' }
  });

  // If no instructor exists, create one
  if (!instructor) {
    console.log('No instructor found. Creating a default instructor...');
    const hashedPassword = await bcrypt.hash('instructor123', 10); // Default password: instructor123
    instructor = await prisma.user.create({
      data: {
        email: 'instructor@example.com',
        passwordHash: hashedPassword,
        name: 'John Doe',
        role: 'INSTRUCTOR',
        bio: 'Experienced software engineer and educator with 10+ years in the industry.',
        avatar: 'https://i.pravatar.cc/150?img=12',
        isActive: true,
        isEmailVerified: true,
      }
    });
    console.log(`✅ Created instructor: ${instructor.name} (${instructor.email})`);
    console.log(`   Default password: instructor123\n`);
  } else {
    console.log(`✅ Using existing instructor: ${instructor.name} (${instructor.email})\n`);
  }

  // Check if courses already exist
  const existingCoursesCount = await prisma.course.count();
  if (existingCoursesCount > 0) {
    console.log(`⚠️  Found ${existingCoursesCount} existing courses.`);
    console.log('Do you want to continue? This will add more courses.');
    console.log('Press Ctrl+C to cancel or wait 3 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  let freeCount = 0;
  let paidCount = 0;

  // Create courses
  for (const courseData of coursesData) {
    try {
      const course = await prisma.course.create({
        data: {
          ...courseData,
          instructorId: instructor.id,
          instructorName: instructor.name,
        }
      });

      if (course.price === 0) {
        freeCount++;
        console.log(`✅ Created FREE course: "${course.title}"`);
      } else {
        paidCount++;
        console.log(`✅ Created PAID course: "${course.title}" - $${course.price}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create course: "${courseData.title}"`, error.message);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Free courses: ${freeCount}`);
  console.log(`   Paid courses: ${paidCount}`);
  console.log(`   Total courses created: ${freeCount + paidCount}`);
  console.log('\n✨ Course seeding completed!');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding courses:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
