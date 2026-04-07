const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.pointsTransaction.deleteMany({});
  await prisma.wallet.deleteMany({});
  const wallet = await prisma.wallet.create({
    data: { shop: 'terrea-dev-store.myshopify.com', customerId: 'demo-customer-1', balance: 750 }
  });
  await prisma.pointsTransaction.createMany({
    data: [
      { walletId: wallet.id, shop: 'terrea-dev-store.myshopify.com', customerId: 'demo-customer-1', amount: 500, type: 'EARN', description: 'Order #1001' },
      { walletId: wallet.id, shop: 'terrea-dev-store.myshopify.com', customerId: 'demo-customer-1', amount: 250, type: 'EARN', description: 'Order #1002' },
    ]
  });
  console.log('Reset! Balance: 750');
  await prisma.$disconnect();
}
main();
