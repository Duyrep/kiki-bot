import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";
import { commands } from "./commands";

const tiktokUsername = process.env.TIKTOK_USERNAME;

export const connection = new TikTokLiveConnection(tiktokUsername, {});

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;
let retryCount = 0;

async function startConnection() {
	try {
		const state = await connection.connect();
		console.info(`Connected to roomId ${state.roomId}`);
		retryCount = 0;
	} catch (err) {
		retryCount++;
		console.error(
			`Unable to connect (Attempt: ${retryCount}/${MAX_RETRIES}):`,
			err,
		);

		if (retryCount >= MAX_RETRIES) {
			console.error("The retry limit has been reached.");
			process.exit(1);
		}

		console.info(
			`Will try to reconnect after ${RETRY_DELAY / 1000} seconds...`,
		);

		await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
		await startConnection();
	}
}

startConnection();

connection.on(WebcastEvent.CHAT, async (data) => {
	console.log(`${data.user?.displayId}: ${data.content}`);

	const content = data?.content?.trim();
	const displayId = data.user?.displayId;
	if (!content || !displayId) return;

	const prefix = process.env.PREFIX || "";

	if (prefix && !content.startsWith(prefix)) return;

	const args = content.slice(prefix.length).trim().split(/ +/);

	const chatCommand = args.shift()?.toLowerCase();
	if (!chatCommand) return;

	const command = commands.find((cmd) => cmd.name === chatCommand);

	if (command) {
		await command.run(...[displayId, ...args]);
	}
});
