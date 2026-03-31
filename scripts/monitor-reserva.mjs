import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const TARGET_URL =
  process.env.TARGET_URL ||
  "https://reserva.be/tsp/reserve?mode=service_staff&search_evt_no=2deJwzMrc0NTMAAARkAT4";
const TARGET_DATE_IDS = (process.env.TARGET_DATE_IDS || "20260411,20260412")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const OUTPUT_DIR = process.env.OUTPUT_DIR || "artifacts";
const SCREENSHOT_PATH =
  process.env.SCREENSHOT_PATH || path.join(OUTPUT_DIR, "reserva-monitor.png");
const RESULT_PATH =
  process.env.RESULT_PATH || path.join(OUTPUT_DIR, "reserva-monitor.json");

function summarizeDateStatus(status) {
  if (!status.found) {
    return "missing";
  }
  if (!status.disabled && !status.className.includes("is-unavailable")) {
    return "available";
  }
  return "unavailable";
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 1200 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  });
  const page = await context.newPage();

  const result = {
    checkedAt: new Date().toISOString(),
    targetUrl: TARGET_URL,
    pageState: "error",
    title: "",
    targetDates: {},
    anyAvailable: false,
    screenshotPath: SCREENSHOT_PATH,
    notes: [],
  };

  try {
    await page.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 45000 });

    result.title = await page.title();
    const bodyText = await page.locator("body").innerText().catch(() => "");

    const isChallenge =
      result.title.includes("Just a moment") ||
      bodyText.includes("Performing security verification") ||
      bodyText.includes("This website uses a security service");

    if (isChallenge) {
      result.pageState = "challenge";
      result.notes.push("Cloudflare challenge page detected.");
    } else {
      result.pageState = "calendar";
      result.targetDates = await page.evaluate((targetIds) => {
        const statuses = {};
        for (const id of targetIds) {
          const input = document.getElementById(id);
          const label = document.querySelector(`label[for="${id}"]`);
          statuses[id] = {
            found: Boolean(input),
            disabled: input ? input.disabled : null,
            className: input ? input.className || "" : "",
            labelText: label ? (label.textContent || "").trim() : "",
          };
        }
        return statuses;
      }, TARGET_DATE_IDS);

      for (const id of TARGET_DATE_IDS) {
        const status = result.targetDates[id];
        if (status) {
          status.summary = summarizeDateStatus(status);
          if (status.summary === "available") {
            result.anyAvailable = true;
          }
        }
      }
    }
  } catch (error) {
    result.pageState = "error";
    result.notes.push(error instanceof Error ? error.message : String(error));
  } finally {
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    await context.close();
    await browser.close();
  }

  await fs.writeFile(RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      "## RESERVA monitor result",
      "",
      `- checkedAt: ${result.checkedAt}`,
      `- pageState: ${result.pageState}`,
      `- title: ${result.title || "(none)"}`,
      `- anyAvailable: ${result.anyAvailable}`,
    ];

    for (const id of TARGET_DATE_IDS) {
      const status = result.targetDates[id];
      if (status) {
        lines.push(`- ${id}: ${status.summary}`);
      }
    }

    if (result.notes.length > 0) {
      lines.push(`- notes: ${result.notes.join(" | ")}`);
    }

    await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`, "utf8");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
