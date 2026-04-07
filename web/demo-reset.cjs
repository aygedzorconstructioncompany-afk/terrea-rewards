const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:C:/Users/info/terrea-rewards/web/prisma/dev.db' } } });
async function main() {
  await prisma.pointsTransaction.deleteMany({});
  await prisma.wallet.updateMany({ data: { balance: 2000 } });
  await prisma.pointsTransaction.createMany({
    data: [
      { walletId: 'cmnfmz79q0000trl0843xk8y1', shop: 'terrea-dev-store.myshopify.com', customerId: 'demo-customer-1', amount: 1000, type: 'EARN', description: 'Order #1001 - $50.00' },
      { walletId: 'cmnfmz79q0000trl0843xk8y1', shop: 'terrea-dev-store.myshopify.com', customerId: 'demo-customer-1', amount: 1000, type: 'EARN', description: 'Order #1002 - $50.00' },
    ]
  });
  const wallets = await prisma.wallet.findMany();
  console.log('Done! Balance:', wallets[0].balance);
  await prisma.$disconnect();
}
main();
