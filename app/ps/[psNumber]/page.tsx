import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProblemStatement } from "@/lib/sih/repository";

export const dynamic = "force-dynamic";

export default async function ProblemStatementPage({ params, searchParams }: { params: Promise<{ psNumber: string }>; searchParams: Promise<{ snapshot?: string }> }) {
  const { psNumber } = await params;
  const query = await searchParams;
  const snapshotId = query.snapshot ? Number(query.snapshot) : undefined;
  const { problem, bundle } = await getProblemStatement(psNumber, Number.isFinite(snapshotId) ? snapshotId : undefined);
  if (!problem) notFound();
  const backHref = bundle.selectedSnapshot && bundle.snapshots[0]?.id !== bundle.selectedSnapshot.id ? `/?snapshot=${bundle.selectedSnapshot.id}` : "/";

  return <div className="min-h-screen bg-neutral-50 text-neutral-950"><header className="border-b border-neutral-200 bg-white"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"><Button asChild variant="ghost"><Link href={backHref}><ArrowLeft /> Back to explorer</Link></Button><Badge variant="secondary">Snapshot #{bundle.selectedSnapshot?.id}</Badge></div></header><main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-12"><article><div className="flex flex-wrap gap-2"><Badge variant="outline">{problem.psNumber}</Badge><Badge variant={problem.category === "Software" ? "secondary" : "warning"}>{problem.category}</Badge><Badge variant="outline">{problem.theme}</Badge></div><h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{problem.title}</h1><p className="mt-4 text-base font-medium text-neutral-600">{problem.organization}</p><div className="mt-8 space-y-5">{problem.background && <Section title="Background" content={problem.background} />}{problem.description && <Section title="Problem description" content={problem.description} />}{problem.expectedSolution && <Section title="Expected solution" content={problem.expectedSolution} />}{problem.datasetInfo && <Section title="Dataset / resources" content={problem.datasetInfo} />}</div></article><aside><div className="sticky top-6 space-y-4"><Card><CardContent className="space-y-5 p-5"><Meta label="Organization" value={problem.organization} /><Meta label="Department" value={problem.department} /><Meta label="Ideas submitted" value={`${problem.submittedIdeas} / ${problem.ideaCapacity}`} /><Meta label="Deadline" value={problem.deadline} /><Meta label="Snapshot" value={bundle.selectedSnapshot ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(bundle.selectedSnapshot.createdAt)) : "—"} /><Button asChild className="w-full"><a href={problem.officialUrl} target="_blank" rel="noreferrer">View official statement <ExternalLink /></a></Button>{problem.datasetUrl && <Button asChild variant="outline" className="w-full"><a href={problem.datasetUrl} target="_blank" rel="noreferrer">Open dataset <ExternalLink /></a></Button>}{problem.youtubeUrl && <Button asChild variant="outline" className="w-full"><a href={problem.youtubeUrl} target="_blank" rel="noreferrer">Open video <ExternalLink /></a></Button>}</CardContent></Card></div></aside></main></div>;
}

function Section({ title, content }: { title: string; content: string }) {
  return <Card><CardContent className="p-6 sm:p-7"><h2 className="text-lg font-semibold">{title}</h2><div className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-neutral-700">{content}</div></CardContent></Card>;
}
function Meta({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p><p className="mt-1 text-sm leading-6 text-neutral-800">{value}</p></div>;
}
