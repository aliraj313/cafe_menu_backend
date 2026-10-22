import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const existing = await prisma.cafe.findUnique({ where: { slug: 'demo-cafe' } });
  if (!existing) {
    await prisma.cafe.create({
      data: {
        name: 'کافه دمو',
        slug: 'demo-cafe',
        isOpen: true,
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
