const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:../dev.db' } } });
async function main() {
  const wallets = await prisma.wallet.findMany();
  console.log('Root DB wallets:', wallets);
  await prisma.$disconnect();
}
main();
