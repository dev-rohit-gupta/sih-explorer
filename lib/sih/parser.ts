import * as cheerio from "cheerio";
import { z } from "zod";
import type { ProblemStatement } from "@/lib/types";

const categorySchema = z.enum(["Software", "Hardware"]);

function fixMojibake(input: string) {
  const replacements: Record<string, string> = {
    "â€™": "'", "â€˜": "'", "â€œ": '"', "â€": '"', "â€”": "—", "â€“": "–", "â€¢": "•", "â€¦": "…", "Â": "", "\u00a0": " "
  };
  return Object.entries(replacements).reduce((text, [from, to]) => text.split(from).join(to), input);
}

function cleanText(input: string) {
  return fixMojibake(input)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cellText($: cheerio.CheerioAPI, el: any) {
  const clone = $(el).clone();
  clone.find("br").replaceWith("\n");
  clone.find("li").each((_, li) => {
    $(li).prepend("• ").append("\n");
  });
  clone.find("p,div").each((_, node) => {
    $(node).append("\n");
  });
  return cleanText(clone.text());
}


function nullableText(text: string | undefined | null) {
  const value = cleanText(text ?? "");
  return !value || /^(?:none|n\/?a|na)$/i.test(value) ? null : value;
}

function firstHttpUrl(text: string | undefined | null) {
  if (!text) return null;
  return text.match(/https?:\/\/[^\s)]+/i)?.[0] ?? null;
}

function splitDescription(text: string) {
  const normalized = cleanText(text);
  const expectedMatch = normalized.match(/(?:^|\n)Expected Solution\s*:?\s*/i);
  const beforeExpected = expectedMatch ? normalized.slice(0, expectedMatch.index).trim() : normalized;
  const expectedSolution = expectedMatch ? normalized.slice((expectedMatch.index ?? 0) + expectedMatch[0].length).trim() : "";

  const descriptionMatch = beforeExpected.match(/(?:^|\n)(?:Detailed )?Description\s*:?\s*/i);
  if (!descriptionMatch) {
    return { background: "", description: beforeExpected, expectedSolution };
  }

  let background = beforeExpected.slice(0, descriptionMatch.index).trim();
  background = background.replace(/^Background\s*:?\s*/i, "").trim();
  const description = beforeExpected.slice((descriptionMatch.index ?? 0) + descriptionMatch[0].length).trim();
  return { background, description, expectedSolution };
}

export function parseSihHtml(html: string, sourceUrl: string): ProblemStatement[] {
  const $ = cheerio.load(html);
  const rows = $("#dataTablePS tbody").first().children("tr").toArray();
  if (!rows.length) throw new Error("SIH parser could not find #dataTablePS rows");

  const problems: ProblemStatement[] = [];

  rows.forEach((row, rowIndex) => {
    const tds = $(row).children("td").toArray();
    if (tds.length < 8) return;

    const psNumber = cleanText($(tds[4]).text());
    const numericId = Number(psNumber.match(/\d+/)?.[0] ?? 0);
    if (!psNumber || !numericId) return;

    const modal = $(row).find("div.modal").first();
    const modalId = modal.attr("id") || `ViewProblemStatement${numericId}`;
    const modalFields = new Map<string, { text: string; hrefs: string[] }>();

    modal.find("table").first().find("tr").each((_, modalRow) => {
      const cells = $(modalRow).children("th,td").toArray();
      if (cells.length < 2) return;
      const key = cleanText($(cells[0]).text());
      if (!key) return;
      const text = cellText($, cells[1]);
      const hrefs = $(cells[1]).find("a[href]").toArray().map((a) => $(a).attr("href")?.trim()).filter((value): value is string => Boolean(value && value !== "#"));
      modalFields.set(key, { text, hrefs });
    });

    const rawDescription = modalFields.get("Description")?.text ?? "";
    const sections = splitDescription(rawDescription);
    const category = categorySchema.safeParse(cleanText($(tds[3]).text()));
    if (!category.success) return;

    const ideaRaw = cleanText($(tds[5]).text());
    const [submittedRaw, capacityRaw] = ideaRaw.split("/");
    const youtube = modalFields.get("Youtube Link");
    const dataset = modalFields.get("Dataset Link");

    problems.push({
      serialNo: Number(cleanText($(tds[0]).text())) || rowIndex + 1,
      psNumber,
      numericId,
      title: cleanText($(tds[2]).find("a").first().text() || $(tds[2]).text()),
      organization: cleanText($(tds[1]).text()),
      department: modalFields.get("Department")?.text || cleanText($(tds[1]).text()),
      category: category.data,
      theme: cleanText($(tds[6]).text()),
      submittedIdeas: Number(submittedRaw) || 0,
      ideaCapacity: Number(capacityRaw) || 500,
      deadline: cleanText($(tds[7]).text()),
      background: sections.background,
      description: sections.description,
      expectedSolution: sections.expectedSolution,
      datasetInfo: nullableText(dataset?.text),
      datasetUrl: dataset?.hrefs.find((href) => /^https?:\/\//i.test(href)) || firstHttpUrl(dataset?.text),
      youtubeUrl: youtube?.hrefs.find((href) => /^https?:\/\//i.test(href)) || firstHttpUrl(youtube?.text),
      contactInfo: nullableText(modalFields.get("Contact info")?.text),
      officialUrl: `${sourceUrl}#${modalId}`
    });
  });

  return problems.sort((a, b) => a.numericId - b.numericId);
}
