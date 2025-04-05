"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster 
      position="top-right" 
      toastOptions={{
        classNames: {
          toast: "group border-border bg-background text-foreground flex p-4 rounded-md shadow-lg",
          title: "font-medium text-foreground",
          description: "text-muted-foreground text-sm",
          actionButton: "bg-primary text-primary-foreground px-3 py-2 text-xs rounded-md",
          cancelButton: "bg-muted text-muted-foreground px-3 py-2 text-xs rounded-md",
          success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200",
          error: "border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200",
          info: "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
          warning: "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200",
        }
      }}
    />
  )
} 