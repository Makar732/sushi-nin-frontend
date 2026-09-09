import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { gte, eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'week'; // 'day' | 'week' | 'month'

    const now = new Date();
    let startDate: Date;

    if (period === 'day') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else {
      // week — последние 7 дней
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    }

    const allOrders = await db
      .select()
      .from(orders)
      .where(gte(orders.createdAt, startDate));

    const completedOrders = allOrders.filter(
      (o) => o.status === 'completed' || o.status === 'delivering' || o.status === 'cooking' || o.status === 'confirmed'
    );

    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = completedOrders.length;
    const avgCheck = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Топ-5 блюд
    const dishCount: Record<string, { title: string; count: number; revenue: number }> = {};

    for (const order of completedOrders) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items as any[]) {
        if (!item?.title || item.price === 0) continue; // пропускаем подарки
        const key = item.title as string;
        if (!dishCount[key]) {
          dishCount[key] = { title: key, count: 0, revenue: 0 };
        }
        dishCount[key].count += item.quantity || 1;
        dishCount[key].revenue += (item.price || 0) * (item.quantity || 1);
      }
    }

    const topDishes = Object.values(dishCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Разбивка по дням (для графика)
    const dailyMap: Record<string, { revenue: number; orders: number }> = {};

    for (const order of completedOrders) {
      if (!order.createdAt) continue;
      const date = new Date(order.createdAt);
      const key = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!dailyMap[key]) dailyMap[key] = { revenue: 0, orders: 0 };
      dailyMap[key].revenue += order.totalAmount || 0;
      dailyMap[key].orders += 1;
    }

    const daily = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Статусная разбивка
    const statusMap: Record<string, number> = {};
    for (const order of allOrders) {
      statusMap[order.status] = (statusMap[order.status] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      period,
      summary: { totalRevenue, totalOrders, avgCheck },
      topDishes,
      daily,
      statusBreakdown: statusMap,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}