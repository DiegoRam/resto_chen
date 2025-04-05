"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { toast } from "sonner"
import { ArrowLeft, ShoppingCart, Utensils, Check, AlertCircle } from "lucide-react"
import { Product, getProducts, createOrder } from "@/lib/supabase"

export default function MenuPage() {
  const router = useRouter()
  const params = useParams()
  const tableId = params.id as string
  
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({})
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})
  const [orderSuccessful, setOrderSuccessful] = useState(false)

  // Fetch products on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts()
        setProducts(data)
      } catch (error) {
        console.error("Error loading products:", error)
        toast.error("Could not load menu items", {
          description: "Please try again or ask for assistance.",
          position: "top-center",
          duration: 5000,
          icon: <AlertCircle className="h-5 w-5" />,
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Reset UI after successful order
  useEffect(() => {
    if (orderSuccessful) {
      // Short delay before redirecting to improve UX
      const redirectTimer = setTimeout(() => {
        router.push(`/table/${tableId}?ordered=true`)
      }, 2500)
      
      return () => clearTimeout(redirectTimer)
    }
  }, [orderSuccessful, tableId, router])

  // Calculate categories and organize products by category
  const { categories, productsByCategory } = useMemo(() => {
    const productMap: { [category: string]: Product[] } = {}
    const uniqueCategories = new Set<string>()

    products.forEach(product => {
      if (!productMap[product.category]) {
        productMap[product.category] = []
      }
      productMap[product.category].push(product)
      uniqueCategories.add(product.category)
    })

    return {
      categories: Array.from(uniqueCategories),
      productsByCategory: productMap
    }
  }, [products])

  // Handle quantity change for a product
  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedItems(prev => {
      if (quantity === 0) {
        // Remove the item if quantity is 0
        const newItems = { ...prev };
        delete newItems[productId];
        return newItems;
      }
      return { ...prev, [productId]: quantity }
    })
  }

  // Handle image error
  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [productId]: true
    }))
  }

  // Calculate total
  const calculateTotal = () => {
    return Object.entries(selectedItems).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId)
      return total + (product ? product.price * quantity : 0)
    }, 0)
  }

  // Place order
  const handlePlaceOrder = async () => {
    if (Object.keys(selectedItems).length === 0) {
      toast.error("No items selected", {
        description: "Please select at least one item to place an order.",
        position: "top-center",
        duration: 5000,
        icon: <AlertCircle className="h-5 w-5" />
      })
      return
    }

    const totalItems = Object.values(selectedItems).reduce((a, b) => a + b, 0)
    const totalPrice = calculateTotal()
    
    // Show a confirmation toast with loading state
    toast.loading(`Placing order for Table ${tableId}...`, {
      position: "top-center",
      duration: 10000 // Long duration as placeholder until success/error
    })

    try {
      setIsPlacingOrder(true)
      
      // Prepare items for the order
      const orderItems = Object.entries(selectedItems).map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId)!
        return {
          productId,
          name: product.name,
          price: product.price,
          quantity
        }
      })

      await createOrder(tableId, orderItems)
      
      // Reset selected items and mark order as successful
      setSelectedItems({})
      setOrderSuccessful(true)
      
      // Dismiss loading and show success
      toast.dismiss()
      toast.success("Order placed successfully!", {
        description: `Your order has been sent to the kitchen. ${totalItems} items, ${formatPrice(totalPrice)}`,
        position: "top-center",
        duration: 5000,
        icon: <Check className="h-5 w-5" />,
        action: {
          label: "View Table",
          onClick: () => router.push(`/table/${tableId}?ordered=true`)
        }
      })
    } catch (error) {
      console.error("Error placing order:", error)
      
      // Dismiss loading and show error
      toast.dismiss()
      toast.error("Could not place your order", {
        description: "Please try again or ask for assistance.",
        position: "top-center",
        duration: 5000,
        icon: <AlertCircle className="h-5 w-5" />
      })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  // If we've just placed a successful order, show a success message
  if (orderSuccessful) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
        <div className="animate-bounce mb-6 bg-green-100 dark:bg-green-900 p-4 rounded-full">
          <Check className="h-16 w-16 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4">Order Placed Successfully!</h1>
        <p className="text-center text-muted-foreground mb-8">
          Your order has been sent to the kitchen and will be prepared shortly.
        </p>
        <Button asChild size="lg" className="px-8">
          <Link href={`/table/${tableId}`}>
            Return to Table
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container px-4 py-6 pb-24 sm:py-8 sm:pb-24">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <Button asChild variant="ghost" size="sm" className="h-10">
          <Link href={`/table/${tableId}`} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Table
          </Link>
        </Button>
      </div>
      
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Menu</h1>
        <p className="text-muted-foreground mt-2">Table {tableId}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : categories.length > 0 ? (
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="mb-4 w-full overflow-x-auto flex flex-nowrap max-w-full justify-start sm:justify-center">
            {categories.map(category => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map(category => (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {productsByCategory[category]?.map(product => (
                  <Card key={product.id} className="overflow-hidden flex flex-col">
                    <div className="relative w-full h-40 sm:h-48">
                      {product.image_url && !imageErrors[product.id] ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          onError={() => handleImageError(product.id)}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Utensils className="h-10 w-10 text-muted-foreground/60" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="line-clamp-2 h-10">
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-0 flex-grow">
                      <p className="font-bold text-lg">{formatPrice(product.price)}</p>
                    </CardContent>
                    <CardFooter className="p-4 flex justify-between items-center">
                      <QuantitySelector
                        initialValue={selectedItems[product.id] || 0}
                        onChange={(value) => handleQuantityChange(product.id, value)}
                      />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No menu items available</p>
        </div>
      )}

      {/* Order summary and checkout button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-between items-center">
        <div>
          <p className="text-sm font-semibold">
            {Object.keys(selectedItems).length > 0
              ? `${Object.values(selectedItems).reduce((a, b) => a + b, 0)} items`
              : "No items selected"}
          </p>
          <p className="text-lg font-bold">
            {formatPrice(calculateTotal())}
          </p>
        </div>
        <Button 
          onClick={handlePlaceOrder} 
          disabled={Object.keys(selectedItems).length === 0 || isPlacingOrder}
          className="px-6"
          size="lg"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Place Order
          {isPlacingOrder && (
            <span className="ml-2 animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          )}
        </Button>
      </div>
    </div>
  )
} 