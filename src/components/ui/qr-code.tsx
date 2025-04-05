"use client"

import { useState, useRef } from 'react'
import QRCode from 'react-qr-code'
import { Button } from './button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Input } from './input'
import { Download, Copy, RefreshCw } from 'lucide-react'

interface QRCodeGeneratorProps {
  baseUrl?: string
  defaultTableId?: string
}

export function QRCodeGenerator({ baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin, defaultTableId = "" }: QRCodeGeneratorProps) {
  const [tableId, setTableId] = useState(defaultTableId)
  const [size, setSize] = useState<"sm" | "md" | "lg">("md")
  const qrRef = useRef<HTMLDivElement>(null)

  // Generate the complete URL for the table
  const tableUrl = `${baseUrl}/table/${tableId}`

  // Handle size changes
  const sizeValues = {
    sm: 128,
    md: 192,
    lg: 256
  }

  // Generate a random table ID
  const generateRandomTableId = () => {
    const randomId = Math.floor(Math.random() * 100) + 1
    setTableId(randomId.toString())
  }

  // Copy URL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(tableUrl)
      .then(() => {
        // Show success message
        alert("URL copied to clipboard!")
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err)
      })
  }

  // Download QR code as PNG
  const downloadQRCode = () => {
    if (!qrRef.current) return
    
    try {
      const canvas = qrRef.current.querySelector("canvas")
      if (!canvas) {
        const svg = qrRef.current.querySelector("svg")
        if (!svg) return
        
        // Convert SVG to canvas and then to image
        const svgData = new XMLSerializer().serializeToString(svg)
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          if (!ctx) return
          
          ctx.drawImage(img, 0, 0)
          const pngFile = canvas.toDataURL("image/png")
          
          // Download the PNG
          const downloadLink = document.createElement("a")
          downloadLink.download = `table-${tableId}-qrcode.png`
          downloadLink.href = pngFile
          downloadLink.click()
        }
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
        return
      }
      
      // If canvas exists, download directly
      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = `table-${tableId}-qrcode.png`
      downloadLink.href = pngFile
      downloadLink.click()
    } catch (error) {
      console.error("Error downloading QR code", error)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Table QR Code Generator</CardTitle>
        <CardDescription>Generate QR codes for table access</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Table ID"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={generateRandomTableId}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Random
          </Button>
        </div>
        
        <Tabs defaultValue="md" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="sm" onClick={() => setSize("sm")}>Small</TabsTrigger>
            <TabsTrigger value="md" onClick={() => setSize("md")}>Medium</TabsTrigger>
            <TabsTrigger value="lg" onClick={() => setSize("lg")}>Large</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {tableId ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-white p-4 rounded-lg" ref={qrRef}>
              <QRCode
                size={sizeValues[size]}
                value={tableUrl}
                viewBox={`0 0 ${sizeValues[size]} ${sizeValues[size]}`}
              />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Scan to access Table {tableId}
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button onClick={downloadQRCode}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Enter a table ID to generate QR code
          </div>
        )}
      </CardContent>
    </Card>
  )
} 