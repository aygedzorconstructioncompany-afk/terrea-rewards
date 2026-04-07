const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const wallets = await prisma.wallet.findMany();
  console.log('Before:', wallets);
  for (const w of wallets) {
    await prisma.wallet.update({
      where: { id: w.id },
      data: { balance: 1000 }
    });
  }
  const after = await prisma.wallet.findMany();
  console.log('After:', after);
  await prisma.$disconnect();
}
main();
