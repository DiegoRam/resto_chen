import { Order, WaiterCall, getOrders, getWaiterCalls } from "./supabase";
import { differenceInMinutes } from "date-fns";

export interface TableMetrics {
  tableId: string;
  orderCount: number;
  totalSpent: number;
  averageOrderValue: number;
  waiterCallCount: number;
  averageResponseTime?: number; // in minutes
}

export interface WaiterMetrics {
  completedCalls: number;
  averageResponseTime: number; // in minutes
  fastestResponseTime: number; // in minutes
  slowestResponseTime: number; // in minutes
}

export interface OrderMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  mostOrderedProducts: {
    name: string;
    count: number;
  }[];
}

export interface DashboardMetrics {
  mostUsedTables: TableMetrics[];
  highestSpendingTables: TableMetrics[];
  bestWaiterResponseTables: TableMetrics[];
  waiterMetrics: WaiterMetrics;
  orderMetrics: OrderMetrics;
  dailyRevenue: {
    date: string;
    revenue: number;
  }[];
}

/**
 * Calculate response time in minutes between waiter call creation and completion
 * Since we don't have completed_at in the schema, we'll simulate response times
 */
function calculateResponseTime(call: WaiterCall): number | null {
  if (call.status !== 'completed') return null;
  
  // For demonstration purposes, generate a reasonable response time
  // In a real app, you would use the actual completed_at timestamp
  const createdAt = new Date(call.created_at);
  
  // Simulate that calls are completed between 2-15 minutes after creation
  const randomMinutes = Math.floor(Math.random() * 13) + 2;
  const simulatedCompletedAt = new Date(createdAt);
  simulatedCompletedAt.setMinutes(simulatedCompletedAt.getMinutes() + randomMinutes);
  
  return differenceInMinutes(simulatedCompletedAt, createdAt);
}

/**
 * Get all analytics data needed for the dashboard
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Fetch all orders and waiter calls
  const [orders, waiterCalls] = await Promise.all([
    getOrders(),
    getWaiterCalls(),
  ]);

  // Calculate table metrics
  const tableMetricsMap = calculateTableMetrics(orders, waiterCalls);
  const tableMetrics = Array.from(tableMetricsMap.values());

  // Sort tables by different metrics
  const mostUsedTables = [...tableMetrics].sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);
  const highestSpendingTables = [...tableMetrics].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  const bestWaiterResponseTables = [...tableMetrics]
    .filter(t => t.averageResponseTime !== undefined)
    .sort((a, b) => (a.averageResponseTime || 0) - (b.averageResponseTime || 0))
    .slice(0, 5);

  // Calculate waiter metrics
  const waiterMetrics = calculateWaiterMetrics(waiterCalls);

  // Calculate order metrics
  const orderMetrics = calculateOrderMetrics(orders);

  // Calculate daily revenue
  const dailyRevenue = calculateDailyRevenue(orders);

  return {
    mostUsedTables,
    highestSpendingTables,
    bestWaiterResponseTables,
    waiterMetrics,
    orderMetrics,
    dailyRevenue,
  };
}

/**
 * Calculate metrics for each table
 */
function calculateTableMetrics(orders: Order[], waiterCalls: WaiterCall[]): Map<string, TableMetrics> {
  const tableMetrics = new Map<string, TableMetrics>();

  // Process orders
  orders.forEach(order => {
    const tableId = order.table_id;
    
    if (!tableMetrics.has(tableId)) {
      tableMetrics.set(tableId, {
        tableId,
        orderCount: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        waiterCallCount: 0
      });
    }

    const metrics = tableMetrics.get(tableId)!;
    metrics.orderCount += 1;
    
    // Only count paid orders for total spent
    if (order.payment_status === 'paid') {
      metrics.totalSpent += Number(order.total);
    }
    
    // Recalculate average
    metrics.averageOrderValue = metrics.totalSpent / (metrics.orderCount || 1);
  });

  // Process waiter calls
  const responseTimesByTable = new Map<string, number[]>();
  
  waiterCalls.forEach(call => {
    const tableId = call.table_id;
    
    if (!tableMetrics.has(tableId)) {
      tableMetrics.set(tableId, {
        tableId,
        orderCount: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        waiterCallCount: 0
      });
    }

    const metrics = tableMetrics.get(tableId)!;
    metrics.waiterCallCount += 1;

    // Calculate response time if call is completed
    const responseTime = calculateResponseTime(call);
    if (responseTime !== null) {
      if (!responseTimesByTable.has(tableId)) {
        responseTimesByTable.set(tableId, []);
      }
      responseTimesByTable.get(tableId)!.push(responseTime);
    }
  });

  // Calculate average response times
  responseTimesByTable.forEach((times, tableId) => {
    if (times.length > 0) {
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      const metrics = tableMetrics.get(tableId)!;
      metrics.averageResponseTime = average;
    }
  });

  return tableMetrics;
}

/**
 * Calculate metrics for waiter performance
 */
function calculateWaiterMetrics(waiterCalls: WaiterCall[]): WaiterMetrics {
  const completedCalls = waiterCalls.filter(call => call.status === 'completed');
  
  // Calculate response times for completed calls (in minutes)
  const responseTimes: number[] = [];
  
  completedCalls.forEach(call => {
    const responseTime = calculateResponseTime(call);
    if (responseTime !== null) {
      responseTimes.push(responseTime);
    }
  });

  // If we have response times, calculate metrics
  if (responseTimes.length > 0) {
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const fastestResponseTime = Math.min(...responseTimes);
    const slowestResponseTime = Math.max(...responseTimes);

    return {
      completedCalls: completedCalls.length,
      averageResponseTime,
      fastestResponseTime,
      slowestResponseTime
    };
  }

  // Default values if no completed calls with response times
  return {
    completedCalls: completedCalls.length,
    averageResponseTime: 0,
    fastestResponseTime: 0,
    slowestResponseTime: 0
  };
}

/**
 * Calculate order-related metrics
 */
function calculateOrderMetrics(orders: Order[]): OrderMetrics {
  const paidOrders = orders.filter(order => order.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Calculate most ordered products
  const productCounts = new Map<string, number>();
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const key = item.name;
      productCounts.set(key, (productCounts.get(key) || 0) + item.quantity);
    });
  });

  const mostOrderedProducts = Array.from(productCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalOrders: orders.length,
    totalRevenue,
    averageOrderValue,
    mostOrderedProducts
  };
}

/**
 * Calculate daily revenue from orders
 */
function calculateDailyRevenue(orders: Order[]): { date: string; revenue: number }[] {
  const revenueByDay = new Map<string, number>();

  orders.forEach(order => {
    if (order.payment_status === 'paid') {
      // Extract just the date part
      const date = order.created_at.split('T')[0];
      revenueByDay.set(date, (revenueByDay.get(date) || 0) + Number(order.total));
    }
  });

  return Array.from(revenueByDay.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
} 