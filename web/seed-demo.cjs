const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const wallet = await prisma.wallet.upsert({
    where: { shop_customer: { shop: 'terrea-dev-store.myshopify.com', customerId: 'demo-customer-1' } },
    update: { balance: 750 },
    create: { shop: 'terrea-dev-store.myshopify.com', customerId: 'demo-customer-1', balance: 750 }
  });
  await prisma.pointsTransaction.createMany({
    data: [
      { walletId: wallet.id, shop: 'terrea-dev-store.myshopify.com', customerId: 'demo-customer-1', amount: 500, type: 'EARN', description: 'Order #1001' },
      { walletId: wallet.id, shop: 'terrea-dev-store.myshopify.com', customerId: 'demo-customer-1', amount: 250, type: 'EARN', description: 'Order #1002' },
    ]
  });
  console.log('Done! Balance:', wallet.balance);
  await prisma.$disconnect();
}
main();
