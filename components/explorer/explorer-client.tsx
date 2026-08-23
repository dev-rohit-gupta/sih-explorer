"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, ExternalLink, Filter, Search, Sparkles } from "lucide-react";
import type { ExplorerBundle, ProblemStatement } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function formatTime(value: string | null) {
  if (!value) return "Not synced yet";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

function shortDescription(problem: ProblemStatement) {
  return (problem.background || problem.description || problem.expectedSolution).replace(/\s+/g, " ").slice(0, 240);
}

export function ExplorerClient({ bundle }: { bundle: ExplorerBundle }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [theme, setTheme] = useState("all");
  const [organization, setOrganization] = useState("all");
  const [sort, setSort] = useState("ps");

  const themes = useMemo(() => [...new Set(bundle.problems.map((p) => p.theme))].sort(), [bundle.problems]);
  const organizations = useMemo(() => [...new Set(bundle.problems.map((p) => p.organization))].sort(), [bundle.problems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = bundle.problems.filter((p) => {
      if (category !== "all" && p.category.toLowerCase() !== category) return false;
      if (theme !== "all" && p.theme !== theme) return false;
      if (organization !== "all" && p.organization !== organization) return false;
      if (!q) return true;
      return [p.psNumber, p.title, p.organization, p.department, p.theme, p.background, p.description, p.expectedSolution].join(" ").toLowerCase().includes(q);
    });
    return [...items].sort((a, b) => sort === "ideas" ? a.submittedIdeas - b.submittedIdeas : sort === "title" ? a.title.localeCompare(b.title) : a.numericId - b.numericId);
  }, [bundle.problems, query, category, theme, organization, sort]);

  const clearFilters = () => { setQuery(""); setCategory("all"); setTheme("all"); setOrganization("all"); };
  const activeFilters = [category !== "all", theme !== "all", organization !== "all", Boolean(query.trim())].filter(Boolean).length;
  const selectedId = bundle.selectedSnapshot?.id;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-neutral-950 text-sm font-bold text-white">SIH</span><span>Explorer <span className="text-neutral-400">2026</span></span></Link>
          <div className="flex items-center gap-2">
            <Badge variant={bundle.sourceStatus.state === "healthy" ? "success" : "warning"}>{bundle.sourceStatus.state === "healthy" ? "Source synced" : "Using saved data"}</Badge>
            <Button asChild variant="ghost" size="sm"><a href={bundle.selectedSnapshot?.sourceUrl || "https://sih.gov.in/sih2026PS"} target="_blank" rel="noreferrer">Official SIH <ExternalLink /></a></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="mb-4"><Sparkles className="mr-1 size-3.5" /> Unofficial, faster SIH explorer</Badge>
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">Find the problem statement your team should actually build.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">Search and filter the official SIH 2026 problem statements without waiting on the original portal. The latest successful snapshot remains available even when the source is slow or down.</p>
            </div>

            <div className="relative mt-8 max-w-3xl"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} className="h-14 rounded-2xl pl-12 pr-4 text-base shadow-sm" placeholder="Search PS number, title, ministry, theme, technology..." /></div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Card><CardContent className="p-5"><p className="text-sm text-neutral-500">Total statements</p><p className="mt-1 text-3xl font-semibold">{bundle.selectedSnapshot?.problemStatementCount ?? bundle.problems.length}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-neutral-500">Software</p><p className="mt-1 text-3xl font-semibold">{bundle.selectedSnapshot?.softwareCount ?? bundle.problems.filter((p) => p.category === "Software").length}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-neutral-500">Hardware</p><p className="mt-1 text-3xl font-semibold">{bundle.selectedSnapshot?.hardwareCount ?? bundle.problems.filter((p) => p.category === "Hardware").length}</p></CardContent></Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem><SelectItem value="software">Software</SelectItem><SelectItem value="hardware">Hardware</SelectItem></SelectContent></Select>
              <Select value={theme} onValueChange={setTheme}><SelectTrigger className="max-w-56"><SelectValue placeholder="Theme" /></SelectTrigger><SelectContent><SelectItem value="all">All themes</SelectItem>{themes.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
              <Select value={organization} onValueChange={setOrganization}><SelectTrigger className="max-w-64"><SelectValue placeholder="Organization" /></SelectTrigger><SelectContent><SelectItem value="all">All organizations</SelectItem>{organizations.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
              {activeFilters > 0 && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear {activeFilters}</Button>}
            </div>
            <div className="flex items-center gap-2">
              {bundle.snapshots.length > 1 && <Select value={String(selectedId)} onValueChange={(value) => window.location.assign(value === String(bundle.snapshots[0].id) ? "/" : `/?snapshot=${value}`)}><SelectTrigger className="min-w-48"><SelectValue /></SelectTrigger><SelectContent>{bundle.snapshots.map((snapshot, index) => <SelectItem key={snapshot.id} value={String(snapshot.id)}>{index === 0 ? "Latest synced" : `Previous #${index}`} · {formatTime(snapshot.createdAt)}</SelectItem>)}</SelectContent></Select>}
              <Select value={sort} onValueChange={setSort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ps">PS number</SelectItem><SelectItem value="title">Title</SelectItem><SelectItem value="ideas">Fewest ideas</SelectItem></SelectContent></Select>
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
            <div><span className="font-medium text-neutral-900">{filtered.length}</span> statements shown · snapshot {bundle.selectedSnapshot ? `#${bundle.selectedSnapshot.id}` : "not available"} · {bundle.sourceStatus.message}</div>
            <div className="text-neutral-500">Last successful data: {formatTime(bundle.selectedSnapshot?.createdAt ?? null)}</div>
          </div>

          {bundle.changes && (bundle.changes.added + bundle.changes.updated + bundle.changes.removed > 0) && <div className="mb-5 flex flex-wrap gap-2"><Badge variant="success">+ {bundle.changes.added} added</Badge><Badge variant="secondary">~ {bundle.changes.updated} updated</Badge><Badge variant="outline">− {bundle.changes.removed} removed</Badge></div>}

          {bundle.problems.length === 0 ? (
            <Card className="border-dashed"><CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><div className="grid size-12 place-items-center rounded-2xl bg-neutral-100"><Filter className="size-5 text-neutral-500" /></div><h2 className="mt-4 text-lg font-semibold">No snapshot available yet</h2><p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">Configure DATABASE_URL and SIH_PS_URL, then call the protected cron sync endpoint once. After the first successful sync, the explorer will continue serving that snapshot even if SIH is unavailable.</p></CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><Search className="size-6 text-neutral-400" /><h2 className="mt-4 font-semibold">No matching problem statements</h2><p className="mt-2 text-sm text-neutral-500">Try a broader keyword or clear some filters.</p><Button className="mt-4" variant="outline" onClick={clearFilters}>Clear filters</Button></CardContent></Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filtered.map((problem) => <ProblemCard key={problem.psNumber} problem={problem} snapshotId={selectedId} />)}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-8 text-sm leading-6 text-neutral-500 sm:px-6 lg:px-8">Unofficial SIH Explorer. Not affiliated with Smart India Hackathon, AICTE or the Ministry of Education. Problem statement data is sourced from the official Smart India Hackathon portal; verify critical submission details on the official source.</div></footer>
    </div>
  );
}

function ProblemCard({ problem, snapshotId }: { problem: ProblemStatement; snapshotId?: number }) {
  const href = snapshotId ? `/ps/${problem.psNumber}?snapshot=${snapshotId}` : `/ps/${problem.psNumber}`;
  return <Card className="group flex h-full flex-col transition hover:-translate-y-0.5 hover:shadow-md"><CardHeader className="gap-4"><div className="flex items-start justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{problem.psNumber}</Badge><Badge variant={problem.category === "Software" ? "secondary" : "warning"}>{problem.category}</Badge></div><span className="text-xs text-neutral-400">{problem.submittedIdeas}/{problem.ideaCapacity} ideas</span></div><div><CardTitle className="text-lg leading-7">{problem.title}</CardTitle><p className="mt-2 text-sm font-medium text-neutral-600">{problem.organization}</p></div></CardHeader><CardContent className="flex flex-1 flex-col"><p className="line-clamp-3 text-sm leading-6 text-neutral-600">{shortDescription(problem)}{shortDescription(problem).length >= 240 ? "…" : ""}</p><div className="mt-5 flex flex-wrap gap-2"><Badge variant="outline">{problem.theme}</Badge><Badge variant="outline"><CalendarDays className="mr-1 size-3.5" /> {problem.deadline}</Badge></div><div className="mt-auto pt-5"><Button asChild variant="ghost" className="-ml-3 group-hover:bg-neutral-100"><Link href={href}>View statement <ArrowRight /></Link></Button></div></CardContent></Card>;
}
