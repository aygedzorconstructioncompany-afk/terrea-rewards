import prisma from "../db.server"

export async function processSubscriptionOrder({
  shop,
  customerId,
  orderId,
  subtotal
}) {

  // 1️⃣ Wallet
  let wallet = await prisma.wallet.findUnique({
    where: {
      shop_customerId: { shop, customerId }
    }
  })

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { shop, customerId }
    })
  }

  // 2️⃣ Progress
  let progress = await prisma.subscriptionProgress.findUnique({
    where: {
      shop_customerId: { shop, customerId }
    }
  })

  if (!progress) {
    progress = await prisma.subscriptionProgress.create({
      data: {
        shop,
        customerId,
        monthsCount: 0,
        stage: 1,
        totalSpent: 0
      }
    })
  }

  const newMonth = progress.monthsCount + 1

  // обновляем прогресс
  await prisma.subscriptionProgress.update({
    where: {
      shop_customerId: { shop, customerId }
    },
    data: {
      monthsCount: newMonth,
      totalSpent: progress.totalSpent + subtotal,
      lastOrderAt: new Date()
    }
  })

  // 3️⃣ Получаем последние циклы
  const cycles = await prisma.pointsTransaction.findMany({
    where: {
      shop,
      customerId,
      type: "cycle_order"
    },
    orderBy: { createdAt: "desc" },
    take: 9
  })

  // сохраняем текущий заказ как цикл
  await prisma.pointsTransaction.create({
    data: {
      walletId: wallet.id,
      shop,
      customerId,
      type: "cycle_order",
      points: subtotal,
      orderId,
      description: "Subscription order"
    }
  })

  let cashback = 0
  let percent = 0

  // 🔥 4️⃣ Выплаты

  // 4-й месяц → 10% за 1-3
  if (newMonth === 4) {
    const last3 = cycles.slice(0, 3)
    const sum = last3.reduce((acc, c) => acc + c.points, 0)

    percent = 10
    cashback = Math.floor(sum * 0.10)
  }

  // 7-й месяц → 15% за 4-6
  if (newMonth === 7) {
    const last3 = cycles.slice(0, 3)
    const sum = last3.reduce((acc, c) => acc + c.points, 0)

    percent = 15
    cashback = Math.floor(sum * 0.15)
  }

  // 10-й месяц → 20% за 7-9
  if (newMonth === 10) {
    const last3 = cycles.slice(0, 3)
    const sum = last3.reduce((acc, c) => acc + c.points, 0)

    percent = 20
    cashback = Math.floor(sum * 0.20)
  }

  // после 10 месяца → 20% каждый месяц
  if (newMonth > 10) {
    percent = 20
    cashback = Math.floor(subtotal * 0.20)
  }

  // 5️⃣ Начисление
  if (cashback > 0) {

    const expires = new Date()
    expires.setMonth(expires.getMonth() + 6)

    await prisma.pointsTransaction.create({
      data: {
        walletId: wallet.id,
        shop,
        customerId,
        type: "cashback",
        points: cashback,
        orderId,
        description: `${percent}% cashback`,
        expiresAt: expires
      }
    })

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: cashback }
      }
    })
  }

}