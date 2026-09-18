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

// Observer tối ưu: kiểm tra trực tiếp trạng thái readyState và gom gọn truy vấn DOM
const browserObserverScript = `
(() => {
  const TARGET_CHAT_ATTR = '[data-overlay-item-type="CHAT"]';

  function extractChatData(chatItemEl) {
    if (!chatItemEl || !window.onLiveChatMessage) return;

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

  function initObserver() {
    const targetRoot = document.body || document.documentElement;
    if (!targetRoot) return;

    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        if (mutation.type !== "childList") continue;

        const nodes = mutation.addedNodes;
        for (let j = 0; j < nodes.length; j++) {
          const node = nodes[j];
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          const el = node;
          if (el.matches && el.matches(TARGET_CHAT_ATTR)) {
            extractChatData(el);
          } else if (el.closest) {
            const chatRow = el.closest(TARGET_CHAT_ATTR);
            if (chatRow) {
              extractChatData(chatRow);
            }
          }
        }
      }
    });

    observer.observe(targetRoot, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initObserver, { once: true });
  } else {
    initObserver();
  }
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

    // Tối ưu flags khởi chạy cho Windows
    browser = await chromium.launch({
      headless: true,
      args: [
        // Tắt GPU và DirectWrite rendering trên Windows
        "--disable-gpu",
        "--disable-software-rasterizer",
        // Tắt các background processes không cần thiết
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-breakpad",
        "--disable-component-update",
        "--disable-domain-reliability",
        "--disable-extensions",
        "--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process",
        "--disable-ipc-flooding-protection",
        "--disable-renderer-backgrounding",
        "--disable-sync",
        // Tắt âm thanh
        "--mute-audio",
      ],
    });

    context = await browser.newContext({
      // Giảm độ phân giải viewport để Chromium tốn ít RAM/CPU dựng DOM
      viewport: { width: 800, height: 600 },
      deviceScaleFactor: 1,
    });

    page = await context.newPage();

    // Chặn request hình ảnh, media và phông chữ nhằm loại bỏ nghẽn I/O trên Windows
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (type === "image" || type === "media" || type === "font") {
        return route.abort();
      }
      return route.continue();
    });

    // Expose hàm nhận message từ DOM
    await page.exposeFunction("onLiveChatMessage", (msg: IncomingChatMessage) => {
      handleChatMessage(msg);
    });

    // Tiêm observer trước khi load trang
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

    // Dùng domcontentloaded thay vì load/networkidle để vào trạng thái lắng nghe ngay
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

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