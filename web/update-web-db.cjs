const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:C:/Users/info/terrea-rewards/web/prisma/dev.db' } } });
async function main() {
  const wallets = await prisma.wallet.findMany();
  console.log('Wallets:', JSON.stringify(wallets, null, 2));
  for (const w of wallets) {
    await prisma.wallet.update({
      where: { id: w.id },
      data: { balance: 1000 }
    });
  }
  console.log('Updated to 1000!');
  await prisma.$disconnect();
}
main();
