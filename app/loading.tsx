import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <div className="min-h-screen bg-neutral-50"><div className="border-b border-neutral-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><Skeleton className="h-7 w-36" /><Skeleton className="mt-5 h-12 max-w-2xl" /><Skeleton className="mt-4 h-6 max-w-xl" /><Skeleton className="mt-8 h-14 max-w-3xl rounded-2xl" /></div></div><div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">{Array.from({ length: 6 }).map((_, index) => <Card key={index}><CardContent className="space-y-4 p-6"><Skeleton className="h-5 w-28" /><Skeleton className="h-7 w-4/5" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div></div>;
}
