const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.wallet.update({
    where: { id: 'cmnf7aztz0000tra0yhfcwjza' },
    data: { balance: 750 }
  });
  console.log('Updated to 750!');
  await prisma.$disconnect();
}
main();
