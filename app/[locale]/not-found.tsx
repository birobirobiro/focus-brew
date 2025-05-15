"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

function NotFoundContent() {
  const searchParams = useSearchParams();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <h2 className="text-xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
          {searchParams?.get("from") && (
            <p className="text-sm text-muted-foreground">
              Redirected from: {searchParams.get("from")}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/" passHref>
            <Button className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md border shadow-lg">
            <CardContent className="py-10 text-center">
              <h2 className="text-xl font-semibold">Loading...</h2>
            </CardContent>
          </Card>
        </div>
      }
    >
      <NotFoundContent />
    </Suspense>
  );
}
