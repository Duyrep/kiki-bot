declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: "development" | "production";

		SERVER_URL: string;
		YOUTUBE_MUSIC_API_SERVER: string;
		EULER_API_KEY: string;
		TIKTOK_USERNAME: string;
		BOT_SESSION_ID: string;
		BOT_TARGET_IDC: string;
		PREFIX?: string;
	}
}
