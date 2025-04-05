"use client"

import Link from "next/link"
import { ClipboardList, Home, Menu, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-bold text-xl flex items-center">
              Resto Chen
              <span className="text-xs ml-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Admin
              </span>
            </Link>
          </div>
          
          {/* Mobile Navigation */}
          <div className="sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[75vw] sm:w-[350px]">
                <nav className="flex flex-col space-y-4 mt-6">
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 text-lg p-2 hover:bg-accent rounded-md"
                  >
                    <Home className="h-5 w-5" />
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/orders"
                    className="flex items-center gap-2 text-lg p-2 hover:bg-accent rounded-md"
                  >
                    <ClipboardList className="h-5 w-5" />
                    Orders
                  </Link>
                  <Link
                    href="/admin/users"
                    className="flex items-center gap-2 text-lg p-2 hover:bg-accent rounded-md"
                  >
                    <User className="h-5 w-5" />
                    Users
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 text-lg p-2 hover:bg-accent rounded-md"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/admin"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/orders"
              className="text-sm font-medium transition-colors hover:text-muted-foreground flex items-center gap-1"
            >
              <ClipboardList className="h-4 w-4" />
              Orders
            </Link>
            <Link
              href="/admin/users"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1"
            >
              <User className="h-4 w-4" />
              Users
            </Link>
            <Link
              href="/admin/settings"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
} 