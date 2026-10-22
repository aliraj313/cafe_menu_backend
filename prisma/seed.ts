import { MealType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SETTINGS_ID = 'default';

async function main(): Promise<void> {
  await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: {
      id: SETTINGS_ID,
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
