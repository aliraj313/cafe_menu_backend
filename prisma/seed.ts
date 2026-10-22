import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { MealType, PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/** Must match ConfigsService.SETTINGS.SINGLETON_ID */
const SETTINGS_SINGLETON_ID = 1;
const BCRYPT_SALT_ROUNDS = 12;

async function main(): Promise<void> {
  const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'changeme123';

  const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_SALT_ROUNDS);
  await prisma.admin.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash,
      isActive: true,
    },
    create: {
      username: adminUsername,
      passwordHash,
      isActive: true,
    },
  });

  await prisma.settings.upsert({
    where: { id: SETTINGS_SINGLETON_ID },
    update: {},
    create: {
      id: SETTINGS_SINGLETON_ID,
      cafeName: 'کافه من',
      slogan: 'طعم واقعی قهوه',
      workingHours: 'همه‌روزه ۸ صبح تا ۱۱ شب',
      ordersAndPaymentsEnabled: false,
    },
  });

  const drinks = await prisma.category.upsert({
    where: { name: 'نوشیدنی' },
    update: {},
    create: { name: 'نوشیدنی' },
  });

  const food = await prisma.category.upsert({
    where: { name: 'غذا' },
    update: {},
    create: { name: 'غذا' },
  });

  const existingLatte = await prisma.product.findFirst({
    where: { name: 'لاته', categoryId: drinks.id },
  });

  if (!existingLatte) {
    await prisma.product.create({
      data: {
        name: 'لاته',
        description: 'لاته کلاسیک با شیر تازه',
        price: 180_000n,
        images: ['https://example.com/images/latte.jpg'],
        mealType: MealType.BREAKFAST,
        isAvailable: true,
        categoryId: drinks.id,
      },
    });
  }

  const existingKebab = await prisma.product.findFirst({
    where: { name: 'چلو کباب', categoryId: food.id },
  });

  if (!existingKebab) {
    await prisma.product.create({
      data: {
        name: 'چلو کباب',
        description: 'چلو کباب کوبیده با برنج ایرانی',
        price: 450_000n,
        images: ['https://example.com/images/kebab.jpg'],
        mealType: MealType.LUNCH,
        isAvailable: true,
        categoryId: food.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
