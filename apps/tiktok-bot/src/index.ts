import { commands } from "@/commands";
import { logger } from "@/utils";
import { type Browser, type BrowserContext, type Page, chromium } from "playwright";

const tiktoryOverlayUrl = process.env.TIKTORY_OVERLAY_URL;

if (!tiktoryOverlayUrl) {
  logger.error(
    { context: "TikTokConnection" },
    "Biến môi trường TIKTORY_OVERLAY_URL bị thiếu!",
  );
  process.exit(1);
}

const targetUrl: string = tiktoryOverlayUrl;

interface IncomingChatMessage {
  displayId: string;
  content: string;
  avatarUrl?: string;
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;
let retryCount = 0;
let isShuttingDown = false;

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;

async function handleChatMessage(data: IncomingChatMessage) {
  const content = data?.content?.trim();
  const displayId = data?.displayId?.trim();
  if (!content || !displayId) return;

  const tokens = content.split(/ +/);

  let command = null;
  let chatCommand = "";
  let commandIndex = -1;

  for (let i = 0; i < tokens.length; i++) {
    const cleanWord = tokens[i]?.replace(/^@+/, "").toLowerCase();
    if (!cleanWord) continue;

    const foundCmd = commands.find((cmd) => cmd.name === cleanWord);
    if (foundCmd) {
      command = foundCmd;
      chatCommand = cleanWord;
      commandIndex = i;
      break;
    }
  }

  if (!command || commandIndex === -1) return;

  const args = tokens.slice(commandIndex + 1);

  try {
    await command.run(...[displayId, ...args]);
  } catch (cmdError) {
    logger.error(
      {
        context: "TikTokCommand",
        user: displayId,
        command: chatCommand,
        error: cmdError,
      },
      `Lỗi khi thực thi lệnh '${chatCommand}'`,
    );
  }
}

const browserObserverScript = `
(() => {
  const TARGET_CHAT_ATTR = '[data-overlay-item-type="CHAT"]';

  function extractChatData(chatItemEl) {
    const spans = chatItemEl.querySelectorAll("span");
    if (spans.length >= 2) {
      const username = spans[0]?.textContent?.trim() || "";
      const comment = spans[1]?.textContent?.trim() || "";
      const avatarEl = chatItemEl.querySelector("img");
      const avatarUrl = avatarEl?.getAttribute("src") || "";

      if (username && comment) {
        window.onLiveChatMessage({
          displayId: username,
          content: comment,
          avatarUrl,
        });
        return;
      }
    }

    const img = chatItemEl.querySelector("img[alt]");
    if (img) {
      const username = img.getAttribute("alt") || "";
      const fullText = chatItemEl.textContent?.trim() || "";
      const comment = fullText.startsWith(username)
        ? fullText.slice(username.length).trim()
        : fullText;

      if (username && comment) {
        window.onLiveChatMessage({
          displayId: username,
          content: comment,
          avatarUrl: img.getAttribute("src") || "",
        });
      }
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node;

        const isInsideChat = el.closest(TARGET_CHAT_ATTR);
        if (!isInsideChat) return;

        if (el.querySelector("img") || el.tagName.toLowerCase() === "img") {
          const chatRow = el.querySelector("img") ? el : el.parentElement;
          if (chatRow) {
            extractChatData(chatRow);
          }
        }
      });
    }
  });

  window.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
})();
`;

async function cleanupBrowser(): Promise<void> {
  try {
    if (page && !page.isClosed()) {
      page.removeAllListeners();
      await page.close().catch(() => {});
    }
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser && browser.isConnected()) {
      await browser.close().catch(() => {});
    }
  } catch (err) {
    logger.warn({ context: "TikTokConnection", error: err }, "Lỗi nhẹ khi cleanup browser");
  } finally {
    page = null;
    context = null;
    browser = null;
  }
}

async function startConnection(): Promise<void> {
  if (isShuttingDown) return;

  await cleanupBrowser();

  try {
    if (retryCount === 0) {
      logger.info(
        { context: "TikTokConnection" },
        "Đang khởi chạy trình duyệt kết nối tới Tiktory...",
      );
    }

    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    context = await browser.newContext();
    page = await context.newPage();

    await page.exposeFunction("onLiveChatMessage", (msg: IncomingChatMessage) => {
      handleChatMessage(msg);
    });

    await page.addInitScript(browserObserverScript);

    page.on("close", () => {
      if (isShuttingDown) return;
      logger.warn({ context: "TikTokConnection" }, "Trang web overlay bị đóng. Đang thử kết nối lại...");
      startConnection();
    });

    page.on("crash", () => {
      if (isShuttingDown) return;
      logger.error({ context: "TikTokConnection" }, "Trang web overlay bị crash. Đang thử kết nối lại...");
      startConnection();
    });

    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

    logger.info(
      { context: "TikTokConnection" },
      "Đã kết nối và đang lắng nghe chat từ overlay Tiktory!",
    );
    retryCount = 0;
  } catch (err) {
    await cleanupBrowser();

    if (isShuttingDown) return;

    retryCount++;
    logger.error(
      {
        context: "TikTokConnection",
        error: err instanceof Error ? err.message : String(err),
      },
      `Kết nối thất bại (Số lần thử lại: ${retryCount}/${MAX_RETRIES})`,
    );

    if (retryCount >= MAX_RETRIES) {
      logger.fatal(
        { context: "TikTokConnection" },
        "Đã đạt số lần thử kết nối tối đa. Đang thoát tiến trình.",
      );
      process.exit(1);
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    logger.info({ context: "TikTokConnection" }, "Đang kết nối lại...");
    await startConnection();
  }
}

const handleExit = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ context: "TikTokConnection" }, "Đang đóng Chromium và thoát ứng dụng...");
  await cleanupBrowser();
  process.exit(0);
};

process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);

startConnection();