import fs from "fs/promises";
import path from "path";

async function main() {
  const sessionPath = process.argv[2];
  const format = process.argv[4] ?? "csv";

  if (!sessionPath || !sessionPath.startsWith("sessions/")) {
    console.error("Usage: npx tsx agent/export.ts <session-path> --format <csv|json>");
    console.error("Example: npx tsx agent/export.ts sessions/2026-04-28-headphone --format csv");
    process.exit(1);
  }

  const manifestPath = path.join(sessionPath, "manifest.json");
  const thoughtsPath = path.join(sessionPath, "thoughts.jsonl");
  const actionsPath = path.join(sessionPath, "actions.jsonl");

  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
    console.log(`\nSession: ${manifest.id}`);
    console.log(`Task:    ${manifest.task}`);
    console.log(`Status:  ${manifest.status}`);
    console.log(`Steps:   ${manifest.totalSteps}\n`);

    const thoughts: object[] = [];
    const thoughtsRaw = await fs.readFile(thoughtsPath, "utf-8");
    for (const line of thoughtsRaw.trim().split("\n")) {
      if (line.trim()) thoughts.push(JSON.parse(line));
    }

    const actions: object[] = [];
    const actionsRaw = await fs.readFile(actionsPath, "utf-8");
    for (const line of actionsRaw.trim().split("\n")) {
      if (line.trim()) actions.push(JSON.parse(line));
    }

    if (format === "json") {
      const output = { manifest, thoughts, actions };
      const outPath = path.join(sessionPath, "export.json");
      await fs.writeFile(outPath, JSON.stringify(output, null, 2));
      console.log(`Exported JSON to ${outPath}`);
    } else {
      const headers = ["Step", "Action", "Thought", "Result", "URL"];
      const rows = thoughts.map((t: Record<string, unknown>, i: number) => {
        const action: Record<string, unknown> = actions[i] ?? {};
        return [
          (t.step as number) ?? i + 1,
          (action.action as string) ?? "",
          `"${(t.thought as string ?? "").slice(0, 100).replace(/"/g, '""')}"`,
          `"${((action.result as string) ?? "").slice(0, 100).replace(/"/g, '""')}"`,
          (action.urlAfter as string) ?? "",
        ].join(",");
      });

      const csv = [headers.join(","), ...rows].join("\n");
      const outPath = path.join(sessionPath, "export.csv");
      await fs.writeFile(outPath, csv);
      console.log(`Exported CSV to ${outPath}`);
    }
  } catch (error) {
    console.error("Export failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
