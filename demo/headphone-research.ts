/**
 * Demo scenario: "Find me the best noise-canceling headphones of 2026
 * and build a comparison table across 5 review sites."
 *
 * This script is a guided walkthrough that demonstrates the agent's
 * capabilities. In production, this flow is driven by the LLM planner.
 *
 * Run: npx tsx demo/headphone-research.ts
 */

import { chromium } from "playwright";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs/promises";
import { BROWSER_DEFAULTS, DEFAULTS } from "../shared/constants.js";

const SESSION_ID = `demo-headphones-${uuid().slice(0, 8)}`;
const SESSION_DIR = path.join(DEFAULTS.SESSION_DIR, `${SESSION_ID}-${new Date().toISOString().slice(0, 10)}`);

interface HeadphoneEntry {
  name: string;
  price: string;
  rating: string;
  source: string;
  pros: string;
  cons: string;
}

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Demo: Best Noise-Canceling Headphones   ║");
  console.log("║   Research + Comparison Table Builder     ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // Ensure session dir
  await fs.mkdir(SESSION_DIR, { recursive: true });
  await fs.mkdir(path.join(SESSION_DIR, "artifacts"), { recursive: true });

  const headless = process.env.HEADLESS !== "false";
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    viewport: { width: BROWSER_DEFAULTS.VIEWPORT_WIDTH, height: BROWSER_DEFAULTS.VIEWPORT_HEIGHT },
    userAgent: BROWSER_DEFAULTS.USER_AGENT,
  });
  const page = await context.newPage();

  const results: HeadphoneEntry[] = [];
  let step = 0;

  async function recordStep(action: string, detail: string) {
    step++;
    console.log(`\n[Step ${step}] ${action}`);
    console.log(`  ${detail}`);
  }

  try {
    // Step 1: Navigate to Google
    await recordStep("navigate", "Going to Google");
    await page.goto("https://www.google.com", {
      timeout: BROWSER_DEFAULTS.NAVIGATION_TIMEOUT,
    });
    await page.waitForTimeout(1500);

    // Step 2: Search
    await recordStep("type + submit", 'Typing "best noise-canceling headphones 2026"');
    const searchBox = page.locator('textarea[name="q"], input[name="q"]');
    await searchBox.fill("best noise-canceling headphones 2026");
    await searchBox.press("Enter");
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Step 3: Collect search results
    await recordStep("extract", "Extracting search result links");
    const searchLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("h3"));
      return links
        .map((h3) => {
          const a = h3.closest("a");
          return {
            title: h3.textContent?.trim() ?? "",
            href: a?.getAttribute("href") ?? "",
          };
        })
        .filter((l) => l.title && l.href)
        .slice(0, 8);
    });

    console.log("  Top results:");
    for (const link of searchLinks) {
      console.log(`    - ${link.title}`);
    }

    // Step 4-6: Visit review sites and extract data (simulated)
    const targetSites = [
      { name: "RTINGS.com", selector: "table", url: null as string | null },
      { name: "Wirecutter", selector: "article", url: null as string | null },
      { name: "SoundGuys", selector: ".entry-content", url: null as string | null },
      { name: "What Hi-Fi", selector: "article", url: null as string | null },
      { name: "Tom's Guide", selector: "article", url: null as string | null },
    ];

    for (const site of targetSites) {
      // Find matching result
      const match = searchLinks.find(
        (l) =>
          l.title.toLowerCase().includes(site.name.toLowerCase()) ||
          l.href.toLowerCase().includes(site.name.toLowerCase().replace(/\s/g, "")),
      );

      if (!match) {
        console.log(`  ⚠ Could not find ${site.name} in search results, skipping`);
        continue;
      }

      site.url = match.href;

      try {
        await recordStep("navigate", `Visiting ${site.name}`);
        await page.goto(match.href, {
          timeout: BROWSER_DEFAULTS.NAVIGATION_TIMEOUT,
        });
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(2000);

        await recordStep("scroll", `Scrolling through ${site.name} article`);
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(1000);
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(1000);

        await recordStep("extract", `Extracting product data from ${site.name}`);

        // Extract page text for parsing
        const pageText = await page.evaluate(() => document.body.innerText.slice(0, 3000));

        // Simulated extraction (in production, LLM would parse this)
        const mockEntry: HeadphoneEntry = {
          name: `Top Pick from ${site.name}`,
          price: "$299-$399",
          rating: `${(Math.random() * 2 + 3).toFixed(1)}/5`,
          source: site.name,
          pros: pageText.slice(200, 350).replace(/\n/g, " "),
          cons: pageText.slice(400, 500).replace(/\n/g, " "),
        };
        results.push(mockEntry);

        console.log(`  ✓ Extracted: ${mockEntry.name} — ${mockEntry.price} (${mockEntry.rating})`);
      } catch (error) {
        console.log(`  ✗ Failed on ${site.name}: ${error instanceof Error ? error.message : error}`);
      }
    }

    // Step 7: Build comparison CSV
    await recordStep("artifact", "Building comparison table");

    const csvHeader = "Product Name,Price,Rating,Source,Pros,Cons";
    const csvRows = results.map((r) =>
      [
        `"${r.name}"`,
        `"${r.price}"`,
        `"${r.rating}"`,
        `"${r.source}"`,
        `"${r.pros.replace(/"/g, '""').slice(0, 150)}"`,
        `"${r.cons.replace(/"/g, '""').slice(0, 150)}"`,
      ].join(","),
    );
    const csv = [csvHeader, ...csvRows].join("\n");

    const csvPath = path.join(SESSION_DIR, "artifacts", "headphone-comparison.csv");
    await fs.writeFile(csvPath, csv);
    console.log(`\n  ✓ CSV saved to ${csvPath}`);

    // Step 8: Build summary JSON
    const summary = {
      task: "Best noise-canceling headphones 2026 comparison",
      generatedAt: new Date().toISOString(),
      sitesVisited: targetSites.filter((s) => s.url).length,
      productsFound: results.length,
      comparison: results,
    };

    const jsonPath = path.join(SESSION_DIR, "artifacts", "headphone-comparison.json");
    await fs.writeFile(jsonPath, JSON.stringify(summary, null, 2));
    console.log(`  ✓ JSON saved to ${jsonPath}`);

    // Step 9: Save session manifest
    const manifest = {
      id: SESSION_ID,
      task: "Find best noise-canceling headphones 2026 and build comparison table",
      status: "completed",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      totalSteps: step,
      llmProvider: "demo",
      llmModel: "scripted",
      artifacts: [csvPath, jsonPath],
      tags: ["demo", "headphone-research", "comparison"],
    };

    const manifestPath = path.join(SESSION_DIR, "manifest.json");
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    // Print final table
    console.log("\n\n═══════════════════════════════════════════");
    console.log("         COMPARISON TABLE                   ");
    console.log("═══════════════════════════════════════════\n");

    console.log("Product Name                  | Price      | Rating | Source");
    console.log("-".repeat(80));
    for (const r of results) {
      const name = r.name.padEnd(30).slice(0, 30);
      const price = r.price.padEnd(12);
      const rating = r.rating.padEnd(8);
      console.log(`${name} | ${price} | ${rating} | ${r.source}`);
    }

    console.log("\n═══════════════════════════════════════════");
    console.log(`Session: ${SESSION_ID}`);
    console.log(`Data:    ${SESSION_DIR}`);
    console.log("Replay:  cd dashboard && npm run dev");
    console.log("═══════════════════════════════════════════\n");

  } catch (error) {
    console.error("\n[DEMO ERROR]", error);
  } finally {
    await browser.close();
  }
}

main();
