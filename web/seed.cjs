const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("START SEED"); // 👈 добавили для проверки

  const customerId = "demo_customer";

  const wallet = await prisma.wallet.upsert({
    where: { customerId },
    update: { balance: 250 },
    create: {
      customerId,
      balance: 250,
    },
  });

  await prisma.transaction.deleteMany({
    where: { walletId: wallet.id },
  });

  await prisma.transaction.createMany({
    data: [
      {
        walletId: wallet.id,
        amount: 100,
        type: "earn",
        description: "Order #1001",
      },
      {
        walletId: wallet.id,
        amount: 150,
        type: "earn",
        description: "Order #1002",
      },
      {
        walletId: wallet.id,
        amount: 50,
        type: "spend",
        description: "Discount used",
      },
    ],
  });

  console.log("✅ Seed done");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());