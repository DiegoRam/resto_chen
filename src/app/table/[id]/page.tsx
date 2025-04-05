"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { callWaiter } from "@/lib/supabase"
import { Bell, UtensilsCrossed } from "lucide-react"

export default function TablePage() {
  // Use the useParams hook to get params instead
  const params = useParams()
  const id = params.id as string
  
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleCallWaiter = async () => {
    try {
      setIsLoading(true)
      await callWaiter(id)
      toast({
        title: "Waiter Called",
        description: "A waiter will be with you shortly.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error calling waiter:", error)
      toast({
        title: "Error",
        description: "Could not call waiter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[100dvh] px-4 py-4 sm:py-8">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center py-4 sm:py-6">
          <CardTitle className="text-xl sm:text-2xl font-bold">Table {id}</CardTitle>
          <CardDescription className="text-sm">Welcome to Resto Chen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <div className="text-center mb-1 sm:mb-2">
            <p className="text-muted-foreground text-sm">What would you like to do?</p>
          </div>
          <div className="grid gap-3 sm:gap-4">
            <Button 
              onClick={handleCallWaiter} 
              disabled={isLoading}
              className="h-16 sm:h-20 text-base sm:text-lg"
              size="lg"
            >
              <Bell className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Call Waiter
              {isLoading && (
                <span className="ml-2 animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              )}
            </Button>
            
            <Button 
              asChild
              variant="outline" 
              className="h-16 sm:h-20 text-base sm:text-lg"
              size="lg"
            >
              <Link href={`/table/${id}/menu`}>
                <UtensilsCrossed className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                Order Food
              </Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-xs sm:text-sm text-muted-foreground px-4 py-3 sm:py-4">
          <p>Need help? Ask your server for assistance.</p>
        </CardFooter>
      </Card>
    </div>
  )
} 