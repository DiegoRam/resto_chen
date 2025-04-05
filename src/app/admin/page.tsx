"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { 
  Bell,
  CookingPot, 
  DollarSignIcon, 
  ListOrderedIcon, 
  RefreshCwIcon, 
  TableIcon, 
  UserIcon,
  CheckIcon,
  XIcon
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Order, 
  OrderItem,
  subscribeToOrders,
  updateOrderStatus,
  updatePaymentStatus,
  WaiterCall,
  subscribeToWaiterCalls,
  updateWaiterCallStatus
} from "@/lib/supabase"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define the notification types
type OrderNotification = 
  | { type: 'newOrder'; order: Order; formattedTotal: string; itemCount: number }
  | { type: 'statusChange'; order: Order; previousStatus: string; newStatus: string };

// Define columns for waiter calls DataTable
const waiterCallColumns: ColumnDef<WaiterCall>[] = [
  {
    accessorKey: "id",
    header: "Call ID",
    cell: ({ row }) => {
      const id = row.getValue("id") as string
      return <span className="font-mono text-xs">{id.substring(0, 8)}...</span>
    }
  },
  {
    accessorKey: "table_id",
    header: "Table",
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <TableIcon className="mr-2 h-4 w-4" />
          <span className="font-semibold">{row.getValue("table_id")}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "created_at",
    header: "Requested At",
    cell: ({ row }) => {
      const timestamp = row.getValue("created_at") as string
      return <span>{format(new Date(timestamp), "MMM d, h:mm a")}</span>
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const call = row.original as WaiterCall
      
      return (
        <Badge 
          key={`status-${call.id}-${call._timestamp || ''}`}
          variant={status === "pending" ? "destructive" : "default"}
        >
          {status === "pending" ? "Pending" : "Completed"}
        </Badge>
      )
    }
  },
  {
    id: "actions",
    header: "Actions",
    cell: function WaiterCallCell({ row }) {
      const call = row.original;
      const [isLoading, setIsLoading] = useState(false);
      
      return (
        <div className="flex space-x-2">
          {call.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await updateWaiterCallStatus(call.id, "completed");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                "Mark Complete"
              )}
            </Button>
          )}
        </div>
      );
    }
  }
];

// Define columns for the orders DataTable
const orderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => {
      const id = row.getValue("id") as string
      return <span className="font-mono text-xs">{id.substring(0, 8)}...</span>
    }
  },
  {
    accessorKey: "table_id",
    header: "Table",
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <TableIcon className="mr-2 h-4 w-4" />
          <span>{row.getValue("table_id")}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const order = row.original as Order
      
      return (
        <Badge 
          key={`status-${order.id}-${order._timestamp || ''}`}
          variant={
            status === "pending" ? "outline" :
            status === "preparing" ? "secondary" :
            status === "completed" ? "default" :
            "destructive"
          }
        >
          {status === "pending" && <ListOrderedIcon className="mr-1 h-3 w-3" />}
          {status === "preparing" && <CookingPot className="mr-1 h-3 w-3" />}
          {status === "completed" && <CheckIcon className="mr-1 h-3 w-3" />}
          {status === "cancelled" && <XIcon className="mr-1 h-3 w-3" />}
          {status}
        </Badge>
      )
    }
  },
  {
    accessorKey: "payment_status",
    header: "Payment",
    cell: ({ row }) => {
      const paymentStatus = row.getValue("payment_status") as string
      const order = row.original as Order
      
      return (
        <Badge 
          key={`payment-${order.id}-${order._timestamp || ''}`}
          variant={
            paymentStatus === "unpaid" ? "outline" :
            paymentStatus === "paid" ? "success" :
            "destructive"
          }
        >
          <DollarSignIcon className="mr-1 h-3 w-3" />
          {paymentStatus}
        </Badge>
      )
    }
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => {
      const timestamp = row.getValue("created_at") as string
      return <span>{format(new Date(timestamp), "MMM d, h:mm a")}</span>
    }
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      const total = parseFloat(row.getValue("total") as string)
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(total)
      return <span className="font-medium">{formatted}</span>
    }
  },
  {
    id: "actions",
    header: "Actions",
    cell: function OrderActionsCell({ row }) {
      const order = row.original;
      const [isStatusLoading, setIsStatusLoading] = useState(false);
      const [isPaymentLoading, setIsPaymentLoading] = useState(false);
      
      // Force re-render of buttons when order changes
      const buttonKey = `button-${order.id}-${order._timestamp || ''}`;
      
      return (
        <div className="flex space-x-2">
          <Button
            key={`status-${buttonKey}`}
            variant="outline"
            size="sm"
            disabled={isStatusLoading}
            onClick={async () => {
              try {
                setIsStatusLoading(true);
                const newStatus = order.status === "pending" ? "preparing" :
                                order.status === "preparing" ? "completed" :
                                order.status === "completed" ? "pending" : "pending";
                
                // Send the update to the server first
                await updateOrderStatus(order.id, newStatus as Order['status']);
                
                // Clone the current orders array
                const currentOrders = [...(window as { __CURRENT_ORDERS__?: Order[] }).__CURRENT_ORDERS__ || []];
                
                // Find and update the order locally to provide immediate UI feedback
                const updatedOrders = currentOrders.map(o => 
                  o.id === order.id ? { ...o, status: newStatus as Order['status'], _timestamp: Date.now() } : o
                ) as Order[];
                
                // Update state through the parent component
                ((window as { __UPDATE_ORDERS_FN__?: (orders: Order[]) => void }).__UPDATE_ORDERS_FN__)?.(updatedOrders);
              } finally {
                setIsStatusLoading(false);
              }
            }}
          >
            {isStatusLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              "Status"
            )}
          </Button>
          <Button
            key={`payment-${buttonKey}`}
            variant={
              order.payment_status === "unpaid" ? "default" : 
              order.payment_status === "paid" ? "secondary" : 
              "outline"
            }
            size="sm"
            disabled={isPaymentLoading}
            onClick={async () => {
              try {
                setIsPaymentLoading(true);
                const newPaymentStatus = order.payment_status === "unpaid" ? "paid" :
                                        order.payment_status === "paid" ? "refunded" :
                                        "unpaid";
                
                // Clone the current orders array
                const currentOrders = [...(window as { __CURRENT_ORDERS__?: Order[] }).__CURRENT_ORDERS__ || []];
                
                // Find and update the order locally to provide immediate UI feedback
                const updatedOrders = currentOrders.map(o => 
                  o.id === order.id ? { ...o, payment_status: newPaymentStatus as Order['payment_status'], _timestamp: Date.now() } : o
                ) as Order[];
                
                // Update state through the parent component
                ((window as { __UPDATE_ORDERS_FN__?: (orders: Order[]) => void }).__UPDATE_ORDERS_FN__)?.(updatedOrders);
                
                // Then send the update to the server
                await updatePaymentStatus(order.id, newPaymentStatus as Order['payment_status']);
                
                // After server update, trigger a refresh in case real-time updates aren't working
                setTimeout(() => {
                  if (window && (window as { __FORCE_REFRESH_FN__?: () => void }).__FORCE_REFRESH_FN__) {
                    (window as { __FORCE_REFRESH_FN__?: () => void }).__FORCE_REFRESH_FN__?.();
                  }
                }, 500);
              } finally {
                setIsPaymentLoading(false);
              }
            }}
          >
            {isPaymentLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <>
                {order.payment_status === "unpaid" && "Pay"}
                {order.payment_status === "paid" && "Paid ✓"}
                {order.payment_status === "refunded" && "Refunded"}
              </>
            )}
          </Button>
        </div>
      );
    }
  }
]

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isWaiterCallsLoading, setIsWaiterCallsLoading] = useState(true)
  const [todaysSales, setTodaysSales] = useState(0)
  const [activeTablesCount, setActiveTablesCount] = useState(0)
  const [activeOrders, setActiveOrders] = useState(0)
  const [pendingWaiterCalls, setPendingWaiterCalls] = useState(0)
  const [paymentFilter, setPaymentFilter] = useState<Order['payment_status'] | 'all'>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Keep track of last processed orders to detect new ones
  const processedOrdersRef = useRef<Set<string>>(new Set());
  const processedWaiterCallsRef = useRef<Set<string>>(new Set());

  // Store previous orders state to compare status changes
  const previousOrdersRef = useRef<Record<string, Order>>({});

  // Function to handle manual refresh
  const handleRefresh = () => {
    setIsLoading(true);
    setIsWaiterCallsLoading(true);
    // Force a complete refresh by incrementing the key
    setRefreshKey(prev => prev + 1);
  };
  
  // Expose the refresh function globally
  useEffect(() => {
    (window as any).__FORCE_REFRESH_FN__ = handleRefresh;
    
    return () => {
      delete (window as any).__FORCE_REFRESH_FN__;
    };
  }, []);

  // Expose orders and update function to window for immediate UI updates
  useEffect(() => {
    (window as any).__CURRENT_ORDERS__ = orders;
    (window as any).__UPDATE_ORDERS_FN__ = setOrders;
    
    return () => {
      delete (window as any).__CURRENT_ORDERS__;
      delete (window as any).__UPDATE_ORDERS_FN__;
    };
  }, [orders]);

  // Subscribe to waiter calls with real-time updates
  useEffect(() => {
    console.log("Setting up waiter calls subscription");
    let initialLoad = true;
    
    const unsubscribe = subscribeToWaiterCalls((latestCalls) => {
      // Add a timestamp to each call to force re-rendering
      const callsWithTimestamp = latestCalls.map(call => ({
        ...call,
        _timestamp: Date.now()
      }));
      
      // Check for new calls
      if (!initialLoad) {
        latestCalls.forEach(call => {
          if (!processedWaiterCallsRef.current.has(call.id) && call.status === 'pending') {
            // This is a new call - show a toast notification
            toast.error(`Table ${call.table_id} needs assistance!`, {
              description: `Waiter call received at ${format(new Date(call.created_at), "h:mm a")}`,
              duration: 10000,
              action: {
                label: "View",
                onClick: () => {
                  // Scroll to the waiter calls section
                  const waiterCallsSection = document.getElementById('waiter-calls-section');
                  if (waiterCallsSection) {
                    waiterCallsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }
              }
            });
            
            // Mark as processed
            processedWaiterCallsRef.current.add(call.id);
          }
        });
      } else {
        // Mark all existing calls as processed on first load
        latestCalls.forEach(call => {
          processedWaiterCallsRef.current.add(call.id);
        });
        initialLoad = false;
      }
      
      // Update state
      setWaiterCalls(callsWithTimestamp);
      setIsWaiterCallsLoading(false);
      
      // Calculate pending waiter calls
      const pending = latestCalls.filter(call => call.status === 'pending').length;
      setPendingWaiterCalls(pending);
    });

    return () => {
      console.log("Cleaning up waiter calls subscription");
      unsubscribe();
    };
  }, [refreshKey]);

  // Subscribe to orders with real-time updates
  useEffect(() => {
    console.log("Setting up real-time subscription, filter:", paymentFilter);
    const filters = paymentFilter !== 'all' ? { payment_status: paymentFilter } : undefined;
    let initialLoad = true;
    let lastUpdateTime = Date.now();
    let debugDiv: HTMLElement | null = null;
    
    // Add a small piece of debug UI that we can remove later
    try {
      debugDiv = document.createElement('div');
      debugDiv.id = 'realtime-debug';
      debugDiv.style.position = 'fixed';
      debugDiv.style.bottom = '10px';
      debugDiv.style.left = '10px';
      debugDiv.style.background = 'rgba(0,0,0,0.7)';
      debugDiv.style.color = 'white';
      debugDiv.style.padding = '5px 10px';
      debugDiv.style.borderRadius = '4px';
      debugDiv.style.fontSize = '12px';
      debugDiv.style.fontFamily = 'monospace';
      debugDiv.style.zIndex = '1000';
      debugDiv.innerHTML = 'Realtime: Initializing...';
      document.body.appendChild(debugDiv);
    } catch (error) {
      console.log('Could not create debug UI:', error);
    }
    
    const updateDebug = (message: string) => {
      if (debugDiv) {
        try {
          const now = new Date();
          const timeStr = now.toLocaleTimeString();
          debugDiv.innerHTML = `Last: ${timeStr}<br>${message}`;
        } catch (error) {
          console.log('Error updating debug UI:', error);
        }
      }
    };
    
    const unsubscribe = subscribeToOrders((latestOrders) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime;
      updateDebug(`Update (${timeSinceLastUpdate}ms ago)<br>Orders: ${latestOrders.length}`);
      
      // Create a new pendingNotifications array for each update
      const pendingNotifications: OrderNotification[] = [];
      
      // Check for order updates and new orders
      if (!initialLoad) {
        // Track status changes for notifications
        const statusChanges: {orderId: string, oldStatus: string, newStatus: string, order: Order}[] = [];
        
        // First pass: check for status changes and collect them
        latestOrders.forEach(order => {
          const isNewOrder = !processedOrdersRef.current.has(order.id);
          const prevOrder = previousOrdersRef.current[order.id];
          
          if (isNewOrder) {
            // This is a new order - add to notifications if pending
            if (order.status === 'pending' && order.payment_status === 'unpaid') {
              try {
                const formattedTotal = new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(parseFloat(order.total.toString()));
                
                toast.success(`New Order from Table ${order.table_id}`, {
                  description: `${getItemCount(order.items)} items - ${formattedTotal}`,
                  duration: 5000,
                  action: {
                    label: "View",
                    onClick: () => {
                      // Scroll to the order in the table
                      const orderRow = document.getElementById(`order-${order.id}`);
                      if (orderRow) {
                        orderRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        orderRow.classList.add('animate-highlight');
                        setTimeout(() => {
                          orderRow.classList.remove('animate-highlight');
                        }, 2000);
                      }
                    }
                  }
                });
              } catch (error) {
                console.error('Error showing toast:', error);
              }
            }
            
            // Mark as processed
            processedOrdersRef.current.add(order.id);
          } 
          // Detect status changes (both from UI and external)
          else if (prevOrder && prevOrder.status !== order.status) {
            // Status has changed!
            statusChanges.push({
              orderId: order.id,
              oldStatus: prevOrder.status,
              newStatus: order.status,
              order: order
            });
          }
          
          // Always update the previous orders ref
          previousOrdersRef.current[order.id] = { ...order };
        });
        
        // Second pass: show notifications for status changes
        statusChanges.forEach(change => {
          const order = change.order;
          const orderRow = document.getElementById(`order-${order.id}`);
          
          const icon = 
            order.status === 'preparing' ? <CookingPot className="h-5 w-5" /> :
            order.status === 'completed' ? <CheckIcon className="h-5 w-5" /> :
            order.status === 'cancelled' ? <XIcon className="h-5 w-5" /> :
            <ListOrderedIcon className="h-5 w-5" />;
            
          const toastType = 
            order.status === 'preparing' ? toast.info :
            order.status === 'completed' ? toast.success :
            order.status === 'cancelled' ? toast.error :
            toast;
            
          toastType(`Order Status Changed: Table ${order.table_id}`, {
            description: `Status updated from ${change.oldStatus} to ${change.newStatus}`,
            duration: 5000,
            icon: icon,
            action: {
              label: "View",
              onClick: () => {
                if (orderRow) {
                  orderRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  orderRow.classList.add('animate-highlight');
                  setTimeout(() => {
                    orderRow.classList.remove('animate-highlight');
                  }, 2000);
                }
              }
            }
          });
        });
      } else {
        // Initial load - mark all as processed
        latestOrders.forEach(order => {
          processedOrdersRef.current.add(order.id);
          previousOrdersRef.current[order.id] = { ...order };
        });
        initialLoad = false;
        updateDebug(`Initial load complete<br>Orders: ${latestOrders.length}`);
      }
      
      // Update the last update time after processing
      lastUpdateTime = now;
      
      // Add a timestamp to each order to force re-rendering
      const ordersWithTimestamp = latestOrders.map(order => ({
        ...order,
        _timestamp: now  // Add a timestamp that changes on each update
      }));
      
      // Force a setState even if the array looks the same
      setOrders([...ordersWithTimestamp]);
      setIsLoading(false);
      
      // Calculate today's sales
      const today = new Date().toISOString().split('T')[0]
      const sales = latestOrders
        .filter(order => order.payment_status === 'paid' && order.created_at.startsWith(today))
        .reduce((sum, order) => sum + parseFloat(order.total.toString()), 0)
      setTodaysSales(sales)
      
      // Calculate active tables (tables with pending or preparing orders)
      const activeTables = new Set(
        latestOrders
          .filter(order => ['pending', 'preparing'].includes(order.status))
          .map(order => order.table_id)
      )
      setActiveTablesCount(activeTables.size)
      
      // Calculate active orders (pending or preparing)
      const active = latestOrders.filter(order => 
        ['pending', 'preparing'].includes(order.status)).length
      setActiveOrders(active)
    }, filters);

    return () => {
      console.log("Cleaning up real-time subscription");
      if (debugDiv && document.body.contains(debugDiv)) {
        try {
          document.body.removeChild(debugDiv);
        } catch (error) {
          console.log('Error removing debug UI:', error);
        }
      }
      unsubscribe();
    }
  }, [paymentFilter, refreshKey])
  
  // Helper function to count total items in an order
  const getItemCount = (items: OrderItem[]) => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <div className="p-4 md:p-8 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of restaurant performance and orders
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ListOrderedIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              Orders being prepared or pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Sales</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(todaysSales)}
            </div>
            <p className="text-xs text-muted-foreground">
              +0% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTablesCount}</div>
            <p className="text-xs text-muted-foreground">
              Tables with active orders
            </p>
          </CardContent>
        </Card>
        <Card className={pendingWaiterCalls > 0 ? "border-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiter Calls</CardTitle>
            <Bell className={`h-4 w-4 ${pendingWaiterCalls > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pendingWaiterCalls > 0 ? "text-destructive" : ""}`}>
              {pendingWaiterCalls}
            </div>
            <p className="text-xs text-muted-foreground">
              Tables waiting for assistance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Waiter Calls Section */}
      {pendingWaiterCalls > 0 && (
        <Card id="waiter-calls-section" className="col-span-4 border-destructive">
          <CardHeader className="flex flex-col md:flex-row justify-between md:items-center space-y-2 md:space-y-0 pb-4">
            <div className="flex items-center">
              <CardTitle>
                <span className="flex items-center">
                  <Bell className="h-5 w-5 text-destructive mr-2 animate-pulse" />
                  Waiter Calls
                </span>
              </CardTitle>
              <Badge variant="destructive" className="ml-2">
                {pendingWaiterCalls} Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isWaiterCallsLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-center">
                  <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading waiter calls...</p>
                </div>
              </div>
            ) : (
              <DataTable
                columns={waiterCallColumns}
                data={waiterCalls.filter(call => call.status === 'pending')}
                searchKey="table_id"
                searchPlaceholder="Search by table..."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Orders Table with Filters */}
      <Card className="col-span-4">
        <CardHeader className="flex flex-col md:flex-row justify-between md:items-center space-y-2 md:space-y-0 pb-4">
          <div>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              Manage orders and payments in real-time
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={paymentFilter}
              onValueChange={(value: string) => setPaymentFilter(value as Order['payment_status'] | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading orders...</p>
              </div>
            </div>
          ) : (
            <DataTable
              columns={orderColumns}
              data={orders}
              searchKey="table_id"
              searchPlaceholder="Search by table..."
            />
          )}
        </CardContent>
      </Card>

      {/* Completed Waiter Calls Section (collapsed by default) */}
      {waiterCalls.filter(call => call.status === 'completed').length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer font-medium text-sm text-muted-foreground">
            View Completed Waiter Calls ({waiterCalls.filter(call => call.status === 'completed').length})
          </summary>
          <div className="mt-2">
            <Card>
              <CardContent className="pt-6">
                <DataTable
                  columns={waiterCallColumns}
                  data={waiterCalls.filter(call => call.status === 'completed')}
                  searchKey="table_id"
                  searchPlaceholder="Search by table..."
                />
              </CardContent>
            </Card>
          </div>
        </details>
      )}
    </div>
  )
} 