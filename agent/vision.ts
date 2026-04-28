import type { Page } from "playwright";
import sharp from "sharp";
import { DEFAULTS } from "../shared/constants.js";

export interface ScreenshotResult {
  path: string;
  width: number;
  height: number;
  timestamp: string;
}

export async function captureScreenshot(
  page: Page,
  savePath: string,
  fullPage = false,
): Promise<ScreenshotResult> {
  const buffer = await page.screenshot({
    fullPage,
    type: DEFAULTS.SCREENSHOT_FORMAT,
    quality: DEFAULTS.SCREENSHOT_QUALITY,
  });

  const compressed = await sharp(buffer)
    .resize({ width: 1280, withoutEnlargement: true })
    .jpeg({ quality: DEFAULTS.SCREENSHOT_QUALITY })
    .toBuffer();

  const metadata = await sharp(compressed).metadata();
  await sharp(compressed).toFile(savePath);

  const url = page.url();

  return {
    path: savePath,
    width: metadata.width ?? DEFAULTS.SCREENSHOT_QUALITY,
    height: metadata.height ?? 800,
    timestamp: new Date().toISOString(),
  };
}

export async function captureDOMSnapshot(page: Page, savePath: string, maxDepth = 15): Promise<void> {
  const snapshot = await page.evaluate(
    ({ maxDepth }) => {
      function serializeElement(el: Element, depth: number): Record<string, unknown> | null {
        if (depth < 0) return null;
        const tag = el.tagName.toLowerCase();
        const result: Record<string, unknown> = { tag };

        if (el.id) result.id = el.id;
        if (el.className && typeof el.className === "string") {
          result.className = el.className;
        }

        const attrs: Record<string, string> = {};
        for (const attr of (el as Element).attributes) {
          if (["data-", "aria-", "href", "src", "alt", "type", "name", "placeholder", "value"].some(
            (p) => attr.name.startsWith(p) || attr.name === p,
          )) {
            attrs[attr.name] = attr.value;
          }
        }
        if (Object.keys(attrs).length) result.attributes = attrs;

        const text = el.textContent?.trim().slice(0, 200);
        if (text) result.text = text;

        const children: unknown[] = [];
        for (const child of el.children) {
          const s = serializeElement(child, depth - 1);
          if (s) children.push(s);
        }
        if (children.length) result.children = children;

        return result;
      }
      return serializeElement(document.body, maxDepth);
    },
    { maxDepth },
  );

  const fs = await import("fs/promises");
  await fs.writeFile(savePath, JSON.stringify(snapshot, null, 2));
}

export async function getPageContext(page: Page) {
  return {
    url: page.url(),
    title: await page.title(),
    viewport: page.viewportSize(),
  };
}
