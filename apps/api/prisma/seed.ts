import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, Category, Status } from '../src/types/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PG Connect database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.grievanceComment.deleteMany();
  await prisma.grievance.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.inviteCode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.room.deleteMany();
  await prisma.pG.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'Suresh Kumar (PG Owner)',
      email: 'suresh@sunrise-pg.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // 2. Create PG Property
  const pg = await prisma.pG.create({
    data: {
      name: 'Sunrise Luxury PG',
      address: '12th Cross Road, Indiranagar, Bengaluru, Karnataka',
      ownerId: admin.id,
    },
  });

  // Update admin's pgId
  await prisma.user.update({
    where: { id: admin.id },
    data: { pgId: pg.id },
  });

  // 3. Create Rooms
  const room101 = await prisma.room.create({
    data: { pgId: pg.id, roomNumber: '101', capacity: 2 },
  });
  const room102 = await prisma.room.create({
    data: { pgId: pg.id, roomNumber: '102', capacity: 2 },
  });

  // 4. Create Staff (Warden)
  const staff = await prisma.user.create({
    data: {
      name: 'Anitha Warden',
      email: 'anitha@sunrise-pg.com',
      passwordHash,
      role: Role.STAFF,
      pgId: pg.id,
    },
  });

  // 5. Create Resident
  const resident = await prisma.user.create({
    data: {
      name: 'Riya Sharma',
      email: 'riya@example.com',
      passwordHash,
      role: Role.RESIDENT,
      pgId: pg.id,
      roomId: room101.id,
    },
  });

  // 6. Create Invite Codes
  await prisma.inviteCode.create({
    data: {
      pgId: pg.id,
      code: 'SUNRISE123',
      roleGranted: Role.RESIDENT,
    },
  });

  await prisma.inviteCode.create({
    data: {
      pgId: pg.id,
      code: 'STAFF999',
      roleGranted: Role.STAFF,
    },
  });

  // 7. Create Grievances
  const g1 = await prisma.grievance.create({
    data: {
      pgId: pg.id,
      roomId: room101.id,
      raisedByUserId: resident.id,
      assignedToUserId: staff.id,
      title: 'AC unit blowing warm air in Room 101',
      description: 'The air conditioner in Room 101 started blowing warm air yesterday evening. Room temperature is quite high.',
      category: Category.MAINTENANCE,
      status: Status.IN_PROGRESS,
    },
  });

  await prisma.grievanceComment.create({
    data: {
      grievanceId: g1.id,
      authorUserId: staff.id,
      body: 'Technician has been scheduled for inspection today at 4 PM.',
    },
  });

  const g2 = await prisma.grievance.create({
    data: {
      pgId: pg.id,
      roomId: room101.id,
      raisedByUserId: resident.id,
      title: 'WiFi connectivity dropping on 1st floor',
      description: 'Intermittent internet disconnects during work hours.',
      category: Category.MAINTENANCE,
      status: Status.OPEN,
    },
  });

  // 8. Create Announcement
  await prisma.announcement.create({
    data: {
      pgId: pg.id,
      authorUserId: admin.id,
      title: 'Water Tank Maintenance Notice',
      body: 'Dear residents, water tank cleaning is scheduled for Saturday between 10 AM and 1 PM. Please store sufficient water.',
    },
  });

  console.log('Database seeded successfully!');
  console.log(`Demo Admin Login: suresh@sunrise-pg.com / password123`);
  console.log(`Demo Resident Login: riya@example.com / password123`);
  console.log(`Demo Resident Invite Code: SUNRISE123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
