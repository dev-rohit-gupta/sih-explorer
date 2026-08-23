import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return <div className="grid min-h-screen place-items-center bg-neutral-50 p-4"><Card className="max-w-md"><CardContent className="p-7 text-center"><p className="text-sm font-medium text-neutral-400">404</p><h1 className="mt-2 text-xl font-semibold">Problem statement not found</h1><p className="mt-2 text-sm leading-6 text-neutral-500">It may not exist in the selected snapshot, or the PS number may have changed.</p><Button asChild className="mt-5"><Link href="/">Back to explorer</Link></Button></CardContent></Card></div>;
}
