import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create a demo user
  const demoEmail = 'demo@example.com';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { passwordHash },
    create: {
      email: demoEmail,
      passwordHash,
    },
  });

  console.log(`👤 Demo user created/verified: ${user.email} (Password: password123)`);

  // 2. Seed initial status entries across various months
  const initialStatuses = [
    { month: 1, day: 1, text: 'New Year celebration and annual goal setting', color: '#10b981' },
    { month: 1, day: 15, text: 'Q1 Project kickoff meeting with engineering team', color: '#3b82f6' },
    { month: 2, day: 14, text: 'Sprint 3 retrospective & documentation update', color: '#a855f7' },
    { month: 2, day: 28, text: 'End of February performance milestone review', color: '#6366f1' },
    { month: 3, day: 8, text: 'Architecture overhaul & database indexing optimization', color: '#f59e0b' },
    { month: 3, day: 25, text: 'CI/CD pipeline refactoring completed', color: '#10b981' },
    { month: 4, day: 12, text: 'Quarterly code freeze and security patch deployment', color: '#f43f5e' },
    { month: 5, day: 1, text: 'International Workers Day team offsite', color: '#64748b' },
    { month: 6, day: 15, text: 'Mid-year progress presentation and user feedback sync', color: '#3b82f6' },
    { month: 7, day: 4, text: 'Summer release v2.0 launched into production', color: '#10b981' },
    { month: 10, day: 4, text: 'Full-stack Day Status Tracker finalized and tested', color: '#10b981' },
  ];

  for (const item of initialStatuses) {
    await prisma.dayStatus.upsert({
      where: {
        month_day: {
          month: item.month,
          day: item.day,
        },
      },
      update: {
        statusText: item.text,
        statusColor: item.color,
        updatedBy: user.id,
      },
      create: {
        month: item.month,
        day: item.day,
        statusText: item.text,
        statusColor: item.color,
        updatedBy: user.id,
      },
    });
  }

  console.log(`✨ Seeded ${initialStatuses.length} day status milestones.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
