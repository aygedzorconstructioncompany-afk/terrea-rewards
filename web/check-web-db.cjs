const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
async function main() {
  const wallets = await prisma.wallet.findMany();
  console.log('Wallets:', JSON.stringify(wallets, null, 2));
  await prisma.$disconnect();
}
main();
