import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRandomQuote } from "@/lib/quotes";

export function MotivationalQuote() {
  // Try to get a quote from the server
  const { data: serverQuote, isLoading, isError } = useQuery({
    queryKey: ['/api/quotes/random'],
  });

  // Fallback to local quotes if the server request fails
  const [fallbackQuote, setFallbackQuote] = useState(getRandomQuote());

  // Refresh fallback quote on error
  useEffect(() => {
    if (isError) {
      setFallbackQuote(getRandomQuote());
    }
  }, [isError]);

  // Use server quote if available, otherwise use fallback
  const quote = serverQuote || fallbackQuote;

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md h-[180px]">
        <CardContent className="flex flex-col justify-between h-full text-white p-6">
          <div>
            <Skeleton className="h-6 w-3/4 bg-white/20 mb-2" />
            <Skeleton className="h-6 w-1/2 bg-white/20" />
          </div>
          <Skeleton className="h-4 w-32 bg-white/20 self-end" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md h-[180px]">
      <CardContent className="flex flex-col justify-between h-full text-white p-6">
        <div className="text-white">
          <p className="text-lg italic font-light mb-2">"{quote.text}"</p>
          <p className="text-sm font-semibold text-right">- {quote.author || "Anonymous"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
