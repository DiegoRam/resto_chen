"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { callWaiter } from "@/lib/supabase"
import { Bell, UtensilsCrossed, ShieldCheck } from "lucide-react"

export default function TablePage() {
  // Use the useParams hook to get params instead
  const params = useParams()
  const id = params.id as string
  
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  
  // Verify the table access when the component mounts
  useEffect(() => {
    // Simple verification: check if the table ID is valid and exists in our system
    // In a production app, you might want to verify against your backend
    const verifyTableAccess = async () => {
      try {
        setIsVerifying(true)
        
        // Check if ID is a valid number
        const tableNumber = parseInt(id)
        if (isNaN(tableNumber) || tableNumber <= 0 || tableNumber > 100) {
          throw new Error("Invalid table ID")
        }
        
        // Simulate an API call to verify table (replace with actual verification)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // If we get here, the table is verified
        setIsVerified(true)
        
        // Save verification in sessionStorage to persist during the session
        sessionStorage.setItem(`table_${id}_verified`, "true")
      } catch (error) {
        console.error("Error verifying table:", error)
        toast({
          title: "Access Denied",
          description: "This table QR code is invalid. Please contact staff.",
          variant: "destructive",
        })
      } finally {
        setIsVerifying(false)
      }
    }
    
    // Check if already verified in this session
    const isAlreadyVerified = sessionStorage.getItem(`table_${id}_verified`) === "true"
    if (isAlreadyVerified) {
      setIsVerified(true)
      setIsVerifying(false)
    } else {
      verifyTableAccess()
    }
  }, [id])

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

  // Show loading state while verifying
  if (isVerifying) {
    return (
      <div className="container flex items-center justify-center min-h-[100dvh] px-4 py-4 sm:py-8">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="text-center py-4 sm:py-6">
            <CardTitle className="text-xl sm:text-2xl font-bold">Verifying Table {id}</CardTitle>
            <CardDescription className="text-sm">Please wait...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Show access denied if not verified
  if (!isVerified) {
    return (
      <div className="container flex items-center justify-center min-h-[100dvh] px-4 py-4 sm:py-8">
        <Card className="w-full max-w-sm shadow-lg border-destructive">
          <CardHeader className="text-center py-4 sm:py-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-destructive">Access Denied</CardTitle>
            <CardDescription className="text-sm">This table QR code is invalid.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 text-center">
            <p>Please scan a valid QR code or contact restaurant staff for assistance.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show the table interface for verified users
  return (
    <div className="container flex items-center justify-center min-h-[100dvh] px-4 py-4 sm:py-8">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center py-4 sm:py-6">
          <div className="flex justify-center items-center mb-2">
            <ShieldCheck className="h-6 w-6 text-primary mr-2" />
            <CardTitle className="text-xl sm:text-2xl font-bold">Table {id}</CardTitle>
          </div>
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