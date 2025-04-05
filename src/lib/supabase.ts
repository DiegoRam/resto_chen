import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key not provided');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Waiter call interfaces and functions
export interface WaiterCall {
  id: string;
  table_id: string;
  status: 'pending' | 'completed';
  created_at: string;
  _timestamp?: number; // Optional timestamp for forcing re-renders
}

// Call waiter function
export async function callWaiter(tableId: string) {
  const { data, error } = await supabase
    .from('waiter_calls')
    .insert([
      { table_id: tableId, status: 'pending', created_at: new Date().toISOString() }
    ])
    .select();
  
  if (error) {
    console.error('Error calling waiter:', error);
    throw error;
  }
  
  return data;
}

// Get all waiter calls
export async function getWaiterCalls(filters?: { status?: WaiterCall['status'] }) {
  let query = supabase
    .from('waiter_calls')
    .select('*')
    .order('created_at', { ascending: false });
  
  // Apply filters if provided
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching waiter calls:', error);
    throw error;
  }
  
  return data as WaiterCall[];
}

// Update waiter call status
export async function updateWaiterCallStatus(callId: string, status: WaiterCall['status']) {
  const { data, error } = await supabase
    .from('waiter_calls')
    .update({ status })
    .eq('id', callId)
    .select();
  
  if (error) {
    console.error('Error updating waiter call status:', error);
    throw error;
  }
  
  return data as WaiterCall[];
}

// Subscribe to waiter calls
export function subscribeToWaiterCalls(callback: (calls: WaiterCall[]) => void, filters?: { status?: WaiterCall['status'] }) {
  // Initial fetch with filters
  getWaiterCalls(filters).then(callback);
  
  // Set up polling
  const pollingInterval = setInterval(() => {
    getWaiterCalls(filters).then(callback);
  }, 2000); // Poll every 2 seconds
  
  // Store the interval ID
  const intervalId = pollingInterval;
  
  // Set up real-time subscription
  let subscription: RealtimeChannel | null = null;
  try {
    const channelName = `waiter-calls-channel-${Math.random().toString(36).substring(2, 11)}`;
    
    subscription = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*',
        schema: 'public', 
        table: 'waiter_calls' 
      }, (payload) => {
        console.log('Real-time waiter call event received:', payload);
        getWaiterCalls(filters).then(callback);
      })
      .subscribe();
  } catch (error) {
    console.error('Error setting up waiter calls subscription:', error);
  }
  
  // Return unsubscribe function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    try {
      if (subscription) {
        subscription.unsubscribe();
      }
    } catch (error) {
      console.log('Error unsubscribing from waiter calls:', error);
    }
  };
}

// Product-related functions
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  available: boolean;
}

// Fetch all products (menu items)
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('available', true)
    .order('category');
  
  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  
  return data as Product[];
}

// Fetch products by category
export async function getProductsByCategory(category: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('available', true);
  
  if (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
  
  return data as Product[];
}

// Order-related functions
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  table_id: string;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  created_at: string;
  updated_at: string;
  total: number;
  items: OrderItem[];
  _timestamp?: number; // Optional timestamp for forcing re-renders
}

// Create a new order
export async function createOrder(tableId: string, items: { productId: string, quantity: number, price: number, name: string }[]) {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const { data, error } = await supabase
    .from('orders')
    .insert([
      { 
        table_id: tableId, 
        status: 'pending',
        payment_status: 'unpaid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total,
        items: items.map(item => ({
          id: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      }
    ])
    .select();
  
  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }
  
  return data as Order[];
}

// Fetch all orders
export async function getOrders(filters?: { status?: Order['status'], payment_status?: Order['payment_status'] }) {
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  
  // Apply filters if provided
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
  
  return data as Order[];
}

// Update order status
export async function updateOrderStatus(orderId: string, status: Order['status']) {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', orderId)
    .select();
  
  if (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
  
  return data as Order[];
}

// Update payment status
export async function updatePaymentStatus(orderId: string, payment_status: Order['payment_status']) {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      payment_status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', orderId)
    .select();
  
  if (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
  
  return data as Order[];
}

// Subscribe to order changes
export function subscribeToOrders(callback: (orders: Order[]) => void, filters?: { status?: Order['status'], payment_status?: Order['payment_status'] }) {
  // Initial fetch with filters
  getOrders(filters).then(callback);
  
  // Always set up polling as a reliable fallback
  const pollingInterval = setInterval(() => {
    getOrders(filters).then(callback);
  }, 2000); // Poll every 2 seconds
  
  // Store the interval ID
  const intervalId = pollingInterval;
  
  // Try to set up real-time subscriptions as an enhancement
  let subscription: RealtimeChannel | null = null;
  try {
    // Create a channel name
    const channelName = `orders-channel-${Math.random().toString(36).substring(2, 11)}`;
    
    // Set up subscription
    subscription = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', // Use * to catch all events
        schema: 'public', 
        table: 'orders' 
      }, (payload) => {
        console.log('Real-time event received:', payload);
        // When we get an update, fetch the latest data
        getOrders(filters).then(callback);
      })
      .subscribe((status) => {
        console.log('Supabase subscription status:', status);
        if (status !== 'SUBSCRIBED') {
          console.log('Falling back to polling due to subscription status:', status);
          // We're already polling, so nothing to do here
        }
      });
  } catch (error) {
    console.error('Error setting up real-time subscription:', error);
    // We're already polling, so nothing to do here
  }
  
  // Return unsubscribe function
  return () => {
    // Always clear the polling interval
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    // Try to unsubscribe, but don't worry if it fails
    try {
      if (subscription) {
        subscription.unsubscribe();
      }
    } catch (error) {
      console.log('Error unsubscribing, but polling was stopped:', error);
    }
  };
} 