"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell
} from "recharts"
import { getDashboardMetrics, DashboardMetrics } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import { RefreshCwIcon, TrendingUpIcon, UsersIcon, ClockIcon, TableIcon, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const data = await getDashboardMetrics()
      setMetrics(data)
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(value)
  }

  const formatTime = (minutes: number | undefined) => {
    if (minutes === undefined) return "N/A"
    return `${minutes.toFixed(1)} min`
  }

  // Colors for visualizations
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  // If data is still loading, show skeleton
  if (isLoading || !metrics) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Insights and trends for restaurant performance
            </p>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <CardTitle className="h-6 bg-muted rounded"></CardTitle>
                <CardDescription className="h-4 w-2/3 bg-muted rounded"></CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and trends for restaurant performance
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.orderMetrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Average Value: {formatCurrency(metrics.orderMetrics.averageOrderValue)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.orderMetrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From paid orders
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.mostUsedTables.length}</div>
            <p className="text-xs text-muted-foreground">
              With at least one order
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.waiterMetrics.averageResponseTime)}</div>
            <p className="text-xs text-muted-foreground">
              For {metrics.waiterMetrics.completedCalls} completed calls
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="tables">Tables Analysis</TabsTrigger>
          <TabsTrigger value="orders">Order Metrics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
        </TabsList>
        
        {/* Tables Analysis Tab */}
        <TabsContent value="tables" className="space-y-4">
          <Alert>
            <AlertTitle>Table Performance Analysis</AlertTitle>
            <AlertDescription>
              Analyze table usage, spending, and service metrics to identify opportunities for optimization.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Most Used Tables */}
            <Card>
              <CardHeader>
                <CardTitle>Most Used Tables</CardTitle>
                <CardDescription>Tables with the highest number of orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.mostUsedTables}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tableId" angle={-45} textAnchor="end" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value} orders`, "Order Count"]} />
                      <Bar dataKey="orderCount" name="Orders" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Highest Spending Tables */}
            <Card>
              <CardHeader>
                <CardTitle>Highest Spending Tables</CardTitle>
                <CardDescription>Tables with the highest total spent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.highestSpendingTables}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tableId" angle={-45} textAnchor="end" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), "Total Spent"]} />
                      <Bar dataKey="totalSpent" name="Total Spent" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Tables by Average Order Value */}
            <Card>
              <CardHeader>
                <CardTitle>Average Order Value by Table</CardTitle>
                <CardDescription>Tables with highest average order value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.highestSpendingTables}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tableId" angle={-45} textAnchor="end" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), "Average Order Value"]} />
                      <Bar dataKey="averageOrderValue" name="Average Order" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Waiter Response Time by Table */}
            <Card>
              <CardHeader>
                <CardTitle>Waiter Response Time by Table</CardTitle>
                <CardDescription>Average response time for service calls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.bestWaiterResponseTables}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tableId" angle={-45} textAnchor="end" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value} minutes`, "Response Time"]} />
                      <Bar dataKey="averageResponseTime" name="Response Time" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Order Metrics Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Alert>
            <AlertTitle>Order Performance Analysis</AlertTitle>
            <AlertDescription>
              Analyze order patterns and popular menu items to optimize your menu and inventory.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Most Popular Items */}
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Items</CardTitle>
                <CardDescription>Items ordered most frequently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.orderMetrics.mostOrderedProducts}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip formatter={(value: number) => [`${value} orders`, "Order Count"]} />
                      <Bar dataKey="count" name="Quantity Ordered" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Orders Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Orders by Table Distribution</CardTitle>
                <CardDescription>How orders are distributed across tables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.mostUsedTables}
                        dataKey="orderCount"
                        nameKey="tableId"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ tableId, orderCount, percent }: { tableId: string; orderCount: number; percent: number }) => 
                          `Table ${tableId}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {metrics.mostUsedTables.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [`${value} orders`, `Table ${name}`]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Waiter Service Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Waiter Service Performance</CardTitle>
                <CardDescription>Response time analysis for service calls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Response Time:</span>
                  <span className="font-bold">{formatTime(metrics.waiterMetrics.averageResponseTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fastest Response Time:</span>
                  <span className="font-bold">{formatTime(metrics.waiterMetrics.fastestResponseTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Slowest Response Time:</span>
                  <span className="font-bold">{formatTime(metrics.waiterMetrics.slowestResponseTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed Service Calls:</span>
                  <span className="font-bold">{metrics.waiterMetrics.completedCalls}</span>
                </div>
                <Alert className="mt-4 bg-muted/50">
                  <AlertDescription>
                    {metrics.waiterMetrics.averageResponseTime <= 5 
                      ? "Great performance! Staff is responding promptly to service calls."
                      : metrics.waiterMetrics.averageResponseTime <= 10
                      ? "Average response time is acceptable but could be improved."
                      : "Response time needs improvement. Consider additional staff training."}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            
            {/* Table Service Call Frequency */}
            <Card>
              <CardHeader>
                <CardTitle>Table Service Call Frequency</CardTitle>
                <CardDescription>Which tables request service most often</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.mostUsedTables}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tableId" angle={-45} textAnchor="end" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value} calls`, "Service Calls"]} />
                      <Bar dataKey="waiterCallCount" name="Service Calls" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Revenue Trends Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Alert>
            <AlertTitle>Revenue Analysis</AlertTitle>
            <AlertDescription>
              Track revenue trends over time and identify opportunities for growth.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4 grid-cols-1">
            {/* Daily Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue</CardTitle>
                <CardDescription>Revenue trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metrics.dailyRevenue}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end"
                        tickFormatter={date => format(new Date(date), 'MMM dd')}
                      />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Revenue" 
                        stroke="#00C49F" 
                        strokeWidth={2}
                        dot={{ stroke: '#00C49F', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {/* Revenue by Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Table</CardTitle>
                  <CardDescription>Top revenue-generating tables</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.highestSpendingTables}
                          dataKey="totalSpent"
                          nameKey="tableId"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={({ tableId, percent }: { tableId: string; percent: number }) => 
                            `Table ${tableId}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {metrics.highestSpendingTables.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Revenue Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Summary</CardTitle>
                  <CardDescription>Key revenue metrics and insights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Revenue:</span>
                    <span className="font-bold">{formatCurrency(metrics.orderMetrics.totalRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Order Value:</span>
                    <span className="font-bold">{formatCurrency(metrics.orderMetrics.averageOrderValue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Top Performing Table:</span>
                    <span className="font-bold">
                      {metrics.highestSpendingTables.length > 0 
                        ? `Table ${metrics.highestSpendingTables[0].tableId} (${formatCurrency(metrics.highestSpendingTables[0].totalSpent)})` 
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Orders:</span>
                    <span className="font-bold">{metrics.orderMetrics.totalOrders}</span>
                  </div>
                  
                  <Alert className="mt-4 bg-muted/50">
                    <AlertDescription>
                      {metrics.orderMetrics.totalOrders > 0 && metrics.orderMetrics.averageOrderValue > 0 && (
                        <>
                          {metrics.orderMetrics.averageOrderValue > 30 
                            ? "High average order value indicates good upselling. Keep it up!" 
                            : "Consider implementing strategies to increase average order value."}
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 