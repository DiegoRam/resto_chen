"use client"

import { useState, useEffect } from "react"
import { QRCodeGenerator } from "@/components/ui/qr-code"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Printer, Download } from "lucide-react"

export default function QRCodesPage() {
  const [tables, setTables] = useState<number[]>([])
  const [baseUrl, setBaseUrl] = useState("")
  const [isMounted, setIsMounted] = useState(false)

  // Set initial state after component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true)
    setBaseUrl(process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
  }, [])

  // Generate tables in a range
  const generateTableRange = (start: number, end: number) => {
    const range = []
    for (let i = start; i <= end; i++) {
      range.push(i)
    }
    setTables(range)
  }

  // Print all QR codes - only available on client
  const printQRCodes = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  // Don't render anything on server
  if (!isMounted) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">QR Code Management</h1>
            <p className="text-muted-foreground">
              Loading QR code generator...
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6 print:py-0 print:space-y-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QR Code Management</h1>
          <p className="text-muted-foreground">
            Generate and print QR codes for restaurant tables
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={printQRCodes}>
            <Printer className="mr-2 h-4 w-4" />
            Print All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generate" className="print:hidden">
        <TabsList>
          <TabsTrigger value="generate">Generate Single QR Code</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Generate</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="mt-4">
          <QRCodeGenerator baseUrl={baseUrl} />
        </TabsContent>
        
        <TabsContent value="bulk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk QR Code Generation</CardTitle>
              <CardDescription>
                Generate QR codes for multiple tables at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Button variant="outline" onClick={() => generateTableRange(1, 10)} className="w-full">
                    Tables 1-10
                  </Button>
                </div>
                <div>
                  <Button variant="outline" onClick={() => generateTableRange(11, 20)} className="w-full">
                    Tables 11-20
                  </Button>
                </div>
                <div>
                  <Button variant="outline" onClick={() => generateTableRange(21, 30)} className="w-full">
                    Tables 21-30
                  </Button>
                </div>
                <div>
                  <Button variant="outline" onClick={() => generateTableRange(1, 30)} className="w-full">
                    All Tables (1-30)
                  </Button>
                </div>
              </div>
              
              {tables.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Generated QR Codes</h3>
                    <Button variant="outline" onClick={printQRCodes}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print All
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    QR codes will open your application with the relevant table ID. Test before printing.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Printable QR codes */}
      {tables.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-0">
          {tables.map(tableId => (
            <div key={tableId} className="print:p-4 print:page-break-inside-avoid">
              <QRCodeGenerator defaultTableId={tableId.toString()} baseUrl={baseUrl} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 