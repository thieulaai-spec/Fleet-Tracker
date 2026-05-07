import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../src/entities/user.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createAdmin() {
  const email = 'admin2@fleettracker.com';
  const password = 'Admin@456';

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    const userRepository = dataSource.getRepository(User);
    
    const existing = await userRepository.findOne({ where: { email } });
    if (existing) {
      console.log(`User ${email} already exists`);
      return;
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = userRepository.create({
      email,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    });

    await userRepository.save(admin);
    console.log(`Admin user created: ${email} / ${password}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

createAdmin();
