import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";
import { commands } from "@/commands";
import { logger } from "@/utils";

const tiktokUsername = process.env.TIKTOK_USERNAME;

if (!tiktokUsername) {
	logger.error(
		{ context: "TikTokConnection" },
		"Biến môi trường TIKTOK_USERNAME bị thiếu!",
	);
	process.exit(1);
}

export const connection = new TikTokLiveConnection(tiktokUsername, {});

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;
let retryCount = 0;

async function startConnection() {
	try {
		if (retryCount === 0) {
			logger.info(
				{ context: "TikTokConnection" },
				`Đang kết nối với TikTok live: ${tiktokUsername}...`,
			);
		}

		const state = await connection.connect();
		logger.info(
			{ context: "TikTokConnection" },
			`Đã kết nối thành công với roomId ${state.roomId}`,
		);
		retryCount = 0;
	} catch (err) {
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
		logger.info({ context: "TikTokConnection" }, `Đang kết nối lại...`);
		await startConnection();
	}
}

startConnection();

connection.on(WebcastEvent.CHAT, async (data) => {
	const content = data?.content?.trim();
	const displayId = data.user?.displayId;
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
		command.run(...[displayId, ...args]);
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
});
