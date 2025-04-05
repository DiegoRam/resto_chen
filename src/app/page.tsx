import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  // Demo tables for the application
  const tables = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 sm:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
          Welcome to Resto Chen
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Select your table to get started
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-6xl w-full">
        {tables.map((tableNumber) => (
          <Card key={tableNumber} className="overflow-hidden">
            <CardHeader className="pb-2 px-4 pt-4 sm:pb-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-lg sm:text-xl">Table {tableNumber}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Tap to access this table</CardDescription>
            </CardHeader>
            <CardContent className="pb-4 px-4 sm:pb-6 sm:px-6">
              <Button asChild className="w-full text-sm sm:text-base">
                <Link href={`/table/${tableNumber}`}>
                  Go to Table
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <footer className="mt-8 sm:mt-12 text-center text-xs sm:text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Resto Chen. All rights reserved.</p>
      </footer>
    </main>
  );
}
