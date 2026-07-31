import { chromium } from "playwright";

const THUMBNAIL_WIDTH = 960;
const THUMBNAIL_HEIGHT = 540;
const THUMBNAIL_DPR = 1.5;
const THUMBNAIL_TIMEOUT_MS = 30000;
const MAX_CONCURRENT_CAPTURES = 16;
const BROWSER_IDLE_CLOSE_MS = 30000;

function abortError() {
  return new DOMException("Thumbnail rendering was cancelled.", "AbortError");
}

export function createThumbnailRenderer() {
  let browser = null;
  let context = null;
  let contextPromise = null;
  let idleCloseTimer = null;
  let activeCaptureCount = 0;
  const captureQueue = [];

  async function ensureContext() {
    clearTimeout(idleCloseTimer);
    idleCloseTimer = null;
    if (context) return context;
    if (!contextPromise) {
      contextPromise = (async () => {
        if (!browser) {
          const launchedBrowser = await chromium.launch({
            headless: true,
            channel: "chromium",
          });
          browser = launchedBrowser;
          launchedBrowser.once("disconnected", () => {
            if (browser === launchedBrowser) {
              browser = null;
              context = null;
              contextPromise = null;
            }
          });
        }
        return browser.newContext({
          viewport: { width: THUMBNAIL_WIDTH, height: THUMBNAIL_HEIGHT },
          deviceScaleFactor: THUMBNAIL_DPR,
        });
      })();
    }
    try {
      context = await contextPromise;
      return context;
    } catch (error) {
      contextPromise = null;
      throw error;
    }
  }

  function scheduleIdleClose() {
    clearTimeout(idleCloseTimer);
    idleCloseTimer = setTimeout(() => {
      const idleBrowser = browser;
      browser = null;
      context = null;
      contextPromise = null;
      void idleBrowser?.close();
    }, BROWSER_IDLE_CLOSE_MS);
    idleCloseTimer.unref?.();
  }

  async function capture(example, origin, signal) {
    if (signal?.aborted) throw abortError();

    let page = null;
    let onAbort = null;
    const runtimeErrors = [];

    try {
      const activeContext = await ensureContext();
      if (signal?.aborted) throw abortError();

      page = await activeContext.newPage();
      onAbort = () => void page.close().catch(() => {});
      signal?.addEventListener("abort", onAbort, { once: true });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));

      const target = new URL(example.entry, origin);
      target.searchParams.set("galleryPaused", "1");
      target.searchParams.set("galleryDpr", String(THUMBNAIL_DPR));
      target.searchParams.set("galleryTimeScale", "1");
      target.searchParams.set("galleryDebugMode", "final");
      target.searchParams.set("galleryThumbnail", "1");
      if (/^webgpu/i.test(example.backend ?? "")) {
        target.searchParams.set("galleryBackend", "webgpu");
      }

      await page.goto(target.href, {
        waitUntil: "domcontentloaded",
        timeout: THUMBNAIL_TIMEOUT_MS,
      });
      await page.locator("html[data-example-ready='true']").waitFor({
        timeout: THUMBNAIL_TIMEOUT_MS,
      });
      if (signal?.aborted) throw abortError();
      if (runtimeErrors.length > 0) {
        throw new Error(runtimeErrors.join("; "));
      }

      return await page.locator("canvas").screenshot({ type: "png" });
    } finally {
      if (onAbort) signal?.removeEventListener("abort", onAbort);
      await page?.close().catch(() => {});
    }
  }

  function runCaptureQueue() {
    while (
      activeCaptureCount < MAX_CONCURRENT_CAPTURES &&
      captureQueue.length > 0
    ) {
      const job = captureQueue.shift();
      activeCaptureCount += 1;
      void capture(job.example, job.origin, job.signal)
        .then(job.resolve, job.reject)
        .finally(() => {
          activeCaptureCount -= 1;
          runCaptureQueue();
          if (activeCaptureCount === 0 && captureQueue.length === 0 && browser) {
            scheduleIdleClose();
          }
        });
    }
  }

  function render(example, origin, { signal } = {}) {
    return new Promise((resolve, reject) => {
      captureQueue.push({ example, origin, signal, resolve, reject });
      runCaptureQueue();
    });
  }

  async function close() {
    clearTimeout(idleCloseTimer);
    idleCloseTimer = null;
    const activeBrowser = browser;
    browser = null;
    context = null;
    contextPromise = null;
    await activeBrowser?.close();
  }

  return { close, render };
}
