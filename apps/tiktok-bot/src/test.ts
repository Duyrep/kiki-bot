import { chromium } from 'playwright';

interface ChatMessage {
  username: string;
  comment: string;
  avatarUrl?: string;
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Nhận dữ liệu chat đã được bóc tách từ browser
  await page.exposeFunction('onLiveChatMessage', (message: ChatMessage) => {
    console.log(`[CHAT] ${message.username}: ${message.comment}`);
  });

  // 2. Lắng nghe qua MutationObserver
  await page.addInitScript(() => {
    const TARGET_CHAT_ATTR = '[data-overlay-item-type="CHAT"]';

    function extractChatData(chatItemEl: Element) {
      // Cách 1: Tìm theo cặp span trong khối text
      const spans = chatItemEl.querySelectorAll('span');
      if (spans.length >= 2) {
        const username = spans[0]?.textContent?.trim() || '';
        const comment = spans[1]?.textContent?.trim() || '';
        const avatarEl = chatItemEl.querySelector('img');
        const avatarUrl = avatarEl?.getAttribute('src') || '';

        if (username && comment) {
          (window as any).onLiveChatMessage({
            username,
            comment,
            avatarUrl
          });
          return;
        }
      }

      // Cách 2 (Dự phòng): Lấy username từ alt của avatar nếu cấu trúc span lệch
      const img = chatItemEl.querySelector('img[alt]');
      if (img) {
        const username = img.getAttribute('alt') || '';
        // Comment là toàn bộ text của chatItem sau khi trừ đi username
        const fullText = chatItemEl.textContent?.trim() || '';
        const comment = fullText.startsWith(username)
          ? fullText.slice(username.length).trim()
          : fullText;

        if (username && comment) {
          (window as any).onLiveChatMessage({
            username,
            comment,
            avatarUrl: img.getAttribute('src') || ''
          });
        }
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;

        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const el = node as Element;

          // Chỉ bắt node con chứa toàn bộ 1 dòng chat (ở đây có thẻ avatar img)
          // để xử lý đúng 1 lần cho mỗi message mới, tránh lặp lại
          const isInsideChatOverlay = el.closest(TARGET_CHAT_ATTR);
          if (!isInsideChatOverlay) return;

          // Trường hợp node vừa thêm là item chat chứa avatar hoặc chính là container chat item
          if (el.querySelector('img') || el.tagName.toLowerCase() === 'img') {
            const chatRow = el.querySelector('img') ? el : el.parentElement;
            if (chatRow) {
              extractChatData(chatRow);
            }
          }
        });
      }
    });

    window.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    });
  });

  const targetUrl = 'https://app.tiktory.com/live/1b37a735-efcc-4422-919a-a0b675d71838';
  console.log(`Đang mở: ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

  console.log('Đang lắng nghe tin nhắn chat...');
  await page.waitForTimeout(600000);
})();