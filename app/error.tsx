"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="grid min-h-screen place-items-center bg-neutral-50 p-4"><Card className="max-w-md"><CardContent className="p-7 text-center"><h1 className="text-xl font-semibold">Explorer could not load</h1><p className="mt-2 text-sm leading-6 text-neutral-500">Your saved snapshots are still safe. Retry the page; if this continues, check the database connection.</p><Button className="mt-5" onClick={reset}>Try again</Button></CardContent></Card></div>;
}
