import type { Page } from "playwright";
import type { BrowserAction, ActionResult } from "../shared/types.js";
import { BROWSER_DEFAULTS } from "../shared/constants.js";

export async function executeAction(
  page: Page,
  action: BrowserAction,
  step: number,
): Promise<ActionResult> {
  const startUrl = page.url();

  try {
    let result: ActionResult = {
      success: true,
      step,
      action,
      result: "",
    };

    switch (action.action) {
      case "navigate": {
        await page.goto(action.url, { timeout: BROWSER_DEFAULTS.NAVIGATION_TIMEOUT });
        result.result = `Navigated to ${action.url}`;
        result.urlAfter = page.url();
        break;
      }

      case "click": {
        if (action.text) {
          await page.getByText(action.text, { exact: false }).first().click({
            timeout: BROWSER_DEFAULTS.ACTION_TIMEOUT,
          });
          result.result = `Clicked element with text "${action.text}"`;
        } else if (action.coordinates) {
          await page.mouse.click(action.coordinates[0], action.coordinates[1]);
          result.result = `Clicked at coordinates ${action.coordinates}`;
        } else if (action.selector) {
          await page.click(action.selector, { timeout: BROWSER_DEFAULTS.ACTION_TIMEOUT });
          result.result = `Clicked element "${action.selector}"`;
        }
        await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
        result.urlAfter = page.url();
        break;
      }

      case "type": {
        await page.fill(action.selector, action.text, {
          timeout: BROWSER_DEFAULTS.ACTION_TIMEOUT,
        });
        if (action.submit) {
          await page.press(action.selector, "Enter");
        }
        result.result = `Typed "${action.text}" into "${action.selector}"${action.submit ? " and submitted" : ""}`;
        result.urlAfter = page.url();
        break;
      }

      case "scroll": {
        if (action.selector) {
          await page.locator(action.selector).scrollIntoViewIfNeeded();
          result.result = `Scrolled to element "${action.selector}"`;
        } else {
          const px = action.amount ?? 500;
          const dir = action.direction === "up" ? -px : px;
          await page.evaluate((scrollY) => window.scrollBy(0, scrollY), dir);
          result.result = `Scrolled ${action.direction ?? "down"} by ${px}px`;
        }
        break;
      }

      case "extract": {
        if (action.selector) {
          result.extractedData = await page.$eval(action.selector, (el) => el.textContent);
        } else {
          result.extractedData = await page.evaluate(() => {
            const tables = Array.from(document.querySelectorAll("table"));
            if (tables.length) {
              return tables.map((t) => {
                const rows = Array.from(t.querySelectorAll("tr"));
                return rows.map((r) =>
                  Array.from(r.querySelectorAll("td, th")).map((c) => c.textContent?.trim() ?? ""),
                );
              });
            }
            return { pageText: document.body.innerText.slice(0, 5000) };
          });
        }
        result.result = `Extracted data from page`;
        break;
      }

      case "wait": {
        if (action.selector) {
          await page.waitForSelector(action.selector, {
            timeout: BROWSER_DEFAULTS.ACTION_TIMEOUT,
          });
          result.result = `Waited for selector "${action.selector}"`;
        } else {
          await page.waitForTimeout(action.ms ?? 2000);
          result.result = `Waited ${action.ms ?? 2000}ms`;
        }
        break;
      }

      case "screenshot": {
        result.result = `Screenshot captured (saved by recording layer)`;
        break;
      }

      case "done": {
        result.result = action.summary ?? "Task completed";
        break;
      }

      default:
        return { success: false, step, action, error: `Unknown action type`, result: "" };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      step,
      action,
      error: error instanceof Error ? error.message : String(error),
      urlAfter: page.url(),
      result: "",
    };
  }
}
