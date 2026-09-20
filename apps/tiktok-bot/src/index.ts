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

  logger.info(
    { context: "TikTokChatReceived" },
    `[${displayId}]: "${content}"`,
  );

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

  function describeNode(node) {
    if (!node) return "[Null/Undefined]";
    const rawContent = node.textContent ? node.textContent.replace(/\\s+/g, " ").trim() : "";
    const contentPreview = rawContent ? (rawContent.length > 60 ? rawContent.slice(0, 60) + "..." : rawContent) : "";
    const contentStr = contentPreview ? \` | Content: "\${contentPreview}"\` : " | [No text content]";

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return \`[Text/Comment]\${contentStr}\`;
    }

    const tag = node.tagName.toLowerCase();
    const id = node.id ? \`#\${node.id}\` : "";
    const classes = node.className && typeof node.className === "string" && node.className.trim()
      ? \`.\${node.className.trim().split(/\\s+/).join(".")}\` 
      : "";
    const chatAttr = node.getAttribute("data-overlay-item-type") 
      ? \`[data-overlay-item-type="\${node.getAttribute("data-overlay-item-type")}"]\` 
      : "";

    return \`<\${tag}\${id}\${classes}\${chatAttr}>\${contentStr}\`;
  }

  function extractChatData(chatItemEl) {
    if (!chatItemEl || !window.onLiveChatMessage) return;

    let username = "";
    let comment = "";
    let avatarUrl = "";

    // Cách 1: Bóc qua các thẻ span con trực tiếp bên trong node này
    const spans = chatItemEl.querySelectorAll("span");
    if (spans.length >= 2) {
      username = spans[0]?.textContent?.trim() || "";
      // Lấy toàn bộ các span phía sau ghép lại để tránh comment dài bị chia cắt
      comment = Array.from(spans).slice(1).map(s => s.textContent?.trim()).filter(Boolean).join(" ");
    }

    // Cách 2: Parse định dạng text phẳng "TênNgườiDùng:ki!p nội dung bài hát"
    if (!comment || !username) {
      const fullText = chatItemEl.textContent?.trim() || "";
      const colonIndex = fullText.indexOf(":");
      if (colonIndex !== -1) {
        username = fullText.slice(0, colonIndex).trim();
        comment = fullText.slice(colonIndex + 1).trim();
      }
    }

    const avatarEl = chatItemEl.querySelector("img");
    if (avatarEl) {
      avatarUrl = avatarEl.getAttribute("src") || "";
    }

    if (username && comment) {
      window.onLiveChatMessage({
        displayId: username,
        content: comment,
        avatarUrl,
      });
    }
  }

  function initObserver() {
    const targetRoot = document.body || document.documentElement;
    if (!targetRoot) return;

    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        if (mutation.type !== "childList") continue;

        if (mutation.addedNodes.length > 0) {
          for (let j = 0; j < mutation.addedNodes.length; j++) {
            console.log("[DOM + THÊM]:", describeNode(mutation.addedNodes[j]));
          }
        }

        if (mutation.removedNodes.length > 0) {
          for (let k = 0; k < mutation.removedNodes.length; k++) {
            console.log("[DOM - XÓA]:", describeNode(mutation.removedNodes[k]));
          }
        }

        const nodes = mutation.addedNodes;
        for (let j = 0; j < nodes.length; j++) {
          const node = nodes[j];
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          const el = node;

          // 1. Kiểm tra nếu bản thân node là hàng chat theo data attribute
          if (el.matches && el.matches(TARGET_CHAT_ATTR)) {
            extractChatData(el);
            continue;
          }

          // 2. Kiểm tra nếu node là dòng chat dạng styled-components (như sc-egrBe)
          if (el.matches && el.matches('div[class*="sc-"]')) {
            extractChatData(el);
            continue;
          }

          // 3. Nếu node là container chứa các tin nhắn bên trong
          const children = el.querySelectorAll ? el.querySelectorAll(TARGET_CHAT_ATTR + ', div[class*="sc-"]') : [];
          if (children.length > 0) {
            children.forEach(extractChatData);
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

    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-gpu",
        "--disable-software-rasterizer",
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
        "--mute-audio",
      ],
    });

    context = await browser.newContext({
      viewport: { width: 800, height: 600 },
      deviceScaleFactor: 1,
    });

    page = await context.newPage();

    page.on("console", (msg) => {
      const text = msg.text();
      if (text.startsWith("[DOM")) {
        console.log(text);
      }
    });

    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (type === "image" || type === "media" || type === "font") {
        return route.abort();
      }
      return route.continue();
    });

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