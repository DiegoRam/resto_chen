"use client"

import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { CheckCircle, Clock, CookingPot, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Order, updateOrderStatus, subscribeToOrders } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingOrders, setUpdatingOrders] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Subscribe to orders from Supabase with real-time updates
    const unsubscribe = subscribeToOrders((latestOrders) => {
      setOrders(latestOrders)
      setIsLoading(false)
    })

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    try {
      // Set updating state for this order
      setUpdatingOrders(prev => ({ ...prev, [orderId]: true }))
      
      // Show loading toast
      toast.loading(`Updating order status...`, {
        id: `order-update-${orderId}`,
        position: "top-center"
      })
      
      await updateOrderStatus(orderId, newStatus)
      
      // Show success toast
      toast.success(`Order status updated to ${newStatus}`, {
        id: `order-update-${orderId}`,
        icon: <CheckCircle className="h-5 w-5" />,
        position: "top-center"
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      
      // Show error toast
      toast.error(`Failed to update order status`, {
        id: `order-update-${orderId}`,
        icon: <AlertCircle className="h-5 w-5" />,
        description: "Please try again or check your connection.",
        position: "top-center"
      })
    } finally {
      // Clear updating state
      setUpdatingOrders(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => {
        const id = String(row.getValue("id"));
        return <div className="font-medium text-xs md:text-sm">{id.substring(0, 8)}...</div>;
      },
    },
    {
      accessorKey: "table_id",
      header: "Table",
      cell: ({ row }) => <div className="text-xs md:text-sm">Table {row.getValue("table_id")}</div>,
    },
    {
      accessorKey: "created_at",
      header: "Time",
      cell: ({ row }) => {
        // Use type assertion to handle the unknown type
        const dateStr = String(row.getValue("created_at"));
        const dateValue = new Date(dateStr);
        
        // Simplified format for mobile
        const mobileFormat = format(dateValue, "HH:mm - dd MMM");
        // Full format for larger screens
        const desktopFormat = format(dateValue, "HH:mm:ss - dd MMM yyyy");
        
        return (
          <>
            <div className="text-xs text-muted-foreground md:hidden">
              {mobileFormat}
            </div>
            <div className="hidden md:block text-sm text-muted-foreground">
              {desktopFormat}
            </div>
          </>
        )
      },
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        const amount = parseFloat(String(row.getValue("total")))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
        return <div className="font-medium text-xs md:text-sm">{formatted}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as Order["status"]
        
        return (
          <Badge
            variant={
              status === "pending" ? "outline" :
              status === "preparing" ? "secondary" :
              status === "completed" ? "default" :
              "destructive"
            }
            className="text-xs md:text-sm whitespace-nowrap"
          >
            {status === "pending" && <Clock className="mr-1 h-3 w-3" />}
            {status === "preparing" && <CookingPot className="mr-1 h-3 w-3" />}
            {status === "completed" && <CheckCircle className="mr-1 h-3 w-3" />}
            {status === "cancelled" && <XCircle className="mr-1 h-3 w-3" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original
        const currentStatus = order.status
        const isUpdating = updatingOrders[order.id] || false
        
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {currentStatus === "pending" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleStatusChange(order.id, "preparing")}
                className="text-xs py-1 h-7 md:text-sm md:h-8 md:py-1 w-full sm:w-auto"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent mr-1" />
                ) : (
                  <CookingPot className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                )}
                <span className="sm:hidden md:inline">Prepare</span>
                <span className="hidden sm:inline md:hidden">Prep</span>
              </Button>
            )}
            
            {currentStatus === "preparing" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleStatusChange(order.id, "completed")}
                className="text-xs py-1 h-7 md:text-sm md:h-8 md:py-1 w-full sm:w-auto"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent mr-1" />
                ) : (
                  <CheckCircle className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                )}
                <span>Complete</span>
              </Button>
            )}
            
            {(currentStatus === "pending" || currentStatus === "preparing") && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-destructive hover:text-destructive text-xs py-1 h-7 md:text-sm md:h-8 md:py-1 w-full sm:w-auto"
                onClick={() => handleStatusChange(order.id, "cancelled")}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-destructive border-t-transparent mr-1" />
                ) : (
                  <XCircle className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                )}
                <span>Cancel</span>
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="container py-4 md:py-10 px-4 md:px-6">
      <Card className="mb-4 md:mb-6">
        <CardHeader className="px-4 md:px-6 py-4 md:py-6">
          <CardTitle className="text-lg md:text-xl">Order Management</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Manage customer orders in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 md:px-6 pb-4 md:pb-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-48 md:h-64">
              <div className="text-center">
                <div className="animate-spin h-6 w-6 md:h-8 md:w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm md:text-base text-muted-foreground">Loading orders...</p>
              </div>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={orders} 
              searchKey="table_id"
              searchPlaceholder="Filter by table..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
} 