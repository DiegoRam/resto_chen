"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, ShoppingCart, Utensils } from "lucide-react"
import { Product, getProducts, createOrder } from "@/lib/supabase"

export default function MenuPage() {
  // Use the useParams hook to get params instead
  const params = useParams()
  const tableId = params.id as string
  
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({})
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})

  // Fetch products on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts()
        setProducts(data)
      } catch (error) {
        console.error("Error loading products:", error)
        toast({
          title: "Error",
          description: "Could not load menu items. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

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

  // Place order
  const handlePlaceOrder = async () => {
    if (Object.keys(selectedItems).length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to place an order.",
        variant: "destructive",
      })
      return
    }

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
      
      // Reset selected items
      setSelectedItems({})
      
      toast({
        title: "Order placed successfully",
        description: "Your order has been sent to the kitchen.",
      })
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error",
        description: "Could not place your order. Please try again.",
        variant: "destructive",
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
            {formatPrice(
              Object.entries(selectedItems).reduce((total, [productId, quantity]) => {
                const product = products.find(p => p.id === productId)
                return total + (product ? product.price * quantity : 0)
              }, 0)
            )}
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