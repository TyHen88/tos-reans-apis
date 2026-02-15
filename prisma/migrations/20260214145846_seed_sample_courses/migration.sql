-- Seed Sample Courses Migration
-- This migration inserts 10 sample courses (5 free, 5 paid) into the database

-- First, ensure we have an instructor user
-- Insert instructor if not exists (using DO block to check)
DO $$
DECLARE
    instructor_id UUID;
BEGIN
    -- Check if instructor exists
    SELECT id INTO instructor_id FROM "User" WHERE role = 'INSTRUCTOR' LIMIT 1;
    
    -- If no instructor exists, create one
    IF instructor_id IS NULL THEN
        INSERT INTO "User" (id, email, name, role, "isActive", "isEmailVerified", bio, avatar, "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid(),
            'instructor@example.com',
            'John Doe',
            'INSTRUCTOR',
            true,
            true,
            'Experienced software engineer and educator with 10+ years in the industry.',
            'https://i.pravatar.cc/150?img=12',
            NOW(),
            NOW()
        )
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- Now insert the courses using the instructor
-- We'll use a subquery to get the instructor ID

-- FREE COURSES (5)

-- 1. Introduction to Web Development
INSERT INTO "Course" (
    id, title, slug, description, thumbnail, "videoUrl", price, level, category, tags, duration, status, 
    "averageRating", "totalRatings", "enrollmentCount", "instructorId", "instructorName", "publishedAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    'Introduction to Web Development',
    'introduction-to-web-development',
    'Learn the fundamentals of web development including HTML, CSS, and JavaScript. Perfect for beginners who want to start their journey in web development. This comprehensive course covers everything from basic syntax to building your first interactive website.',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    'https://www.youtube.com/watch?v=example1',
    0,
    'BEGINNER',
    'Web Development',
    ARRAY['HTML', 'CSS', 'JavaScript', 'Frontend'],
    '8 hours',
    'PUBLISHED',
    4.5,
    125,
    450,
    id,
    name,
    '2024-01-15'::timestamp,
    NOW(),
    NOW()
FROM "User" WHERE role = 'INSTRUCTOR' LIMIT 1;

-- 2. Git and GitHub Essentials
INSERT INTO "Course" (
    id, title, slug, description, thumbnail, "videoUrl", price, level, category, tags, duration, status, 
    "averageRating", "totalRatings", "enrollmentCount", "instructorId", "instructorName", "publishedAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    'Git and GitHub Essentials',
    'git-and-github-essentials',
    'Master version control with Git and collaboration with GitHub. Learn branching, merging, pull requests, and best practices for team collaboration. Essential skills for any developer.',
    'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800',
    'https://www.youtube.com/watch?v=example2',
    0,
    'BEGINNER',
    'Development Tools',
    ARRAY['Git', 'GitHub', 'Version Control', 'Collaboration'],
    '5 hours',
    'PUBLISHED',
    4.7,
    89,
    320,
    id,
    name,
    '2024-02-01'::timestamp,
    NOW(),
    NOW()
FROM "User" WHERE role = 'INSTRUCTOR' LIMIT 1;

-- 3. Python Programming Basics
INSERT INTO "Course" (
    id, title, slug, description, thumbnail, "videoUrl", price, level, category, tags, duration, status, 
    "averageRating", "totalRatings", "enrollmentCount", "instructorId", "instructorName", "publishedAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    'Python Programming Basics',
    'python-programming-basics',
    'Start your programming journey with Python, one of the most popular and beginner-friendly languages. Learn variables, functions, loops, and object-oriented programming concepts.',
    'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
    'https://www.youtube.com/watch?v=example3',
    0,
    'BEGINNER',
    'Programming',
    ARRAY['Python', 'Programming', 'OOP', 'Basics'],
    '10 hours',
    'PUBLISHED',
    4.6,
    203,
    580,
    id,
    name,
    '2024-01-20'::timestamp,
    NOW(),
    NOW()
FROM "User" WHERE role = 'INSTRUCTOR' LIMIT 1;

-- 4. Responsive Web Design Fundamentals
INSERT INTO "Course" (
    id, title, slug, description, thumbnail, "videoUrl", price, level, category, tags, duration, status, 
    "averageRating", "totalRatings", "enrollmentCount", "instructorId", "instructorName", "publishedAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    'Responsive Web Design Fundamentals',
    'responsive-web-design-fundamentals',
    'Create beautiful, mobile-friendly websites that work on any device. Learn CSS Grid, Flexbox, media queries, and modern responsive design techniques.',
    'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800',
    'https://www.youtube.com/watch?v=example4',
    0,
    'BEGINNER',
    'Web Design',
    ARRAY['CSS', 'Responsive Design', 'Mobile', 'Flexbox'],
    '6 hours',
    'PUBLISHED',
    4.4,
    156,
    410,
    id,
    name,
    '2024-02-10'::timestamp,
    NOW(),
    NOW()
FROM "User" WHERE role = 'INSTRUCTOR' LIMIT 1;

-- 5. Introduction to Databases with SQL
INSERT INTO "Course" (
    id, title, slug, description, thumbnail, "videoUrl", price, level, category, tags, duration, status, 
    "averageRating", "totalRatings", "enrollmentCount", "instructorId", "instructorName", "publishedAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    'Introduction to Databases with SQL',
    'introduction-to-databases-with-sql',
    'Understand database fundamentals and master SQL queries. Learn to create, read, update, and delete data, work with joins, and optimize your queries for better performance.',
    'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
    'https://www.youtube.com/watch?v=example5',
    0,
    'BEGINNER',
    'Database',
    ARRAY['SQL', 'Database', 'PostgreSQL', 'MySQL'],
    '7 hours',
    'PUBLISHED',
    4.8,
    178,
    495,
    id,
    name,
    '2024-01-25'::timestamp,
    NOW(),
    NOW()
FROM "User" WHERE role = 'INSTRUCTOR' LIMIT 1;

-- PAID COURSES (5)

-- 6. Advanced React and Next.js Masterclass
INSERT INTO "Course" (
    id, title, slug, description, thumbnail, "videoUrl", price, level, category, tags, duration, status, 
    "averageRating", "totalRatings", "enrollmentCount", "instructorId", "instructorName", "publishedAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    'Advanced React and Next.js Masterclass',
    'advanced-react-and-nextjs-masterclass',
    'Take your React skills to the next level with advanced patterns, performance optimization, and Next.js 14. Build production-ready applications with server components, streaming, and more.',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    'https://www.youtube.com/watch?v=example6',
    49.99,
    'ADVANCED',
    'Web Development',
    ARRAY['React', 'Next.js', 'TypeScript', 'Advanced'],
    '25 hours',
    'PUBLISHED',
    4.9,
    342,
    1250,
    id,
    name,
    '2024-01-10'::timestamp,
    NOW(),
    NOW()
FROM "User" WHERE role = 'INSTRUCTOR' LIMIT 1;

-- 7. Full-Stack Development with Node.js and MongoDB
INSERT INTO "Course" (
    id, title, slug, description, thumbnail, "videoUrl", price, level, category, tags, duration, status, 
    "averageRating", "totalRatings", "enrollmentCount", "instructorId", "instructorName", "publishedAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    'Full-Stack Development with Node.js and MongoDB',
    'fullstack-development-nodejs-mongodb',
    'Build complete web applications from scratch using Node.js, Express, MongoDB, and React. Learn authentication, API design, database modeling, deployment, and best practices.',
    'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
    'https://www.youtube.com/watch?v=example7',
    59.99,
    'INTERMEDIATE',
    'Web Development',
    ARRAY['Node.js', 'MongoDB', 'Express', 'Full-Stack'],
    '30 hours',
    'PUBLISHED',
    4.7,
    287,
    890,
    id,
    name,
    '2024-02-05'::timestamp,
    NOW(),
    NOW()
FROM "User" WHERE role = 'INSTRUCTOR' LIMIT 1;

-- 8. Machine Learning with Python and TensorFlow
INSERT INTO "Course" (
    id, title, slug, description, thumbnail, "videoUrl", price, level, category, tags, duration, status, 
    "averageRating", "totalRatings", "enrollmentCount", "instructorId", "instructorName", "publishedAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    'Machine Learning with Python and TensorFlow',
    'machine-learning-python-tensorflow',
    'Dive into machine learning and AI. Learn neural networks, deep learning, computer vision, and natural language processing. Build real-world ML models and deploy them.',
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
    'https://www.youtube.com/watch?v=example8',
    79.99,
    'ADVANCED',
    'Data Science',
    ARRAY['Machine Learning', 'Python', 'TensorFlow', 'AI'],
    '40 hours',
    'PUBLISHED',
    4.8,
    412,
    1580,
    id,
    name,
    '2024-01-05'::timestamp,
    NOW(),
    NOW()
FROM "User" WHERE role = 'INSTRUCTOR' LIMIT 1;

-- 9. DevOps and Cloud Architecture with AWS
INSERT INTO "Course" (
    id, title, slug, description, thumbnail, "videoUrl", price, level, category, tags, duration, status, 
    "averageRating", "totalRatings", "enrollmentCount", "instructorId", "instructorName", "publishedAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    'DevOps and Cloud Architecture with AWS',
    'devops-cloud-architecture-aws',
    'Master DevOps practices and AWS cloud services. Learn CI/CD, Docker, Kubernetes, infrastructure as code with Terraform, monitoring, and scaling applications in the cloud.',
    'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800',
    'https://www.youtube.com/watch?v=example9',
    69.99,
    'INTERMEDIATE',
    'DevOps',
    ARRAY['AWS', 'DevOps', 'Docker', 'Kubernetes'],
    '35 hours',
    'PUBLISHED',
    4.6,
    198,
    720,
    id,
    name,
    '2024-02-15'::timestamp,
    NOW(),
    NOW()
FROM "User" WHERE role = 'INSTRUCTOR' LIMIT 1;

-- 10. Mobile App Development with React Native
INSERT INTO "Course" (
    id, title, slug, description, thumbnail, "videoUrl", price, level, category, tags, duration, status, 
    "averageRating", "totalRatings", "enrollmentCount", "instructorId", "instructorName", "publishedAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    'Mobile App Development with React Native',
    'mobile-app-development-react-native',
    'Build native iOS and Android apps using React Native. Learn navigation, state management, native modules, animations, and how to publish your apps to the App Store and Google Play.',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
    'https://www.youtube.com/watch?v=example10',
    54.99,
    'INTERMEDIATE',
    'Mobile Development',
    ARRAY['React Native', 'Mobile', 'iOS', 'Android'],
    '28 hours',
    'PUBLISHED',
    4.5,
    234,
    650,
    id,
    name,
    '2024-01-30'::timestamp,
    NOW(),
    NOW()
FROM "User" WHERE role = 'INSTRUCTOR' LIMIT 1;