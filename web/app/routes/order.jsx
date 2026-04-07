import { json } from "@remix-run/node"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const action = async ({ request }) => {
  try {
    const order = await request.json()

    const shop = request.headers.get("x-shopify-shop-domain")

    if (!order || !order.customer) {
      console.log("❌ No customer")
      return json({ ok: true })
    }

    const customerId = String(order.customer.id)
    const totalPrice = parseFloat(order.total_price || 0)

    // 💰 считаем баллы (1$ = 1 point)
    const points = Math.floor(totalPrice)

    // 🔄 создаём или обновляем кошелёк
    const wallet = await prisma.wallet.upsert({
      where: {
        shop_customer: {
          shop,
          customerId,
        },
      },
      update: {
        balance: {
          increment: points,
        },
        totalSpent: {
          increment: totalPrice,
        },
      },
      create: {
        shop,
        customerId,
        balance: points,
        totalSpent: totalPrice,
      },
    })

    // 🧾 записываем транзакцию
    await prisma.pointsTransaction.create({
      data: {
        walletId: wallet.id,
        shop,
        customerId,
        orderId: String(order.id),
        type: "EARN",
        amount: points,
        description: "Points from order",
      },
    })

    console.log("✅ Points added:", points)

    return json({ success: true })
  } catch (e) {
    console.error("ERROR:", e)
    return json({ error: true })
  }
}