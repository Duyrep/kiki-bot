declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: "development" | "production";

		MAX_SONGS_IN_QUEUE: number;

		PORT: number;
		SERVER_URL: string;

		PLAYLIST_URL: string;
		YOUTUBE_MUSIC_API_SERVER: string;

		PUBSUBHUBBUB_URL: string;
		PUBSUBHUBBUB_BASE_TOPIC: string;
		PUBSUBHUBBUB_CHANNEL_ID: string;
		PUBSUBHUBBUB_VERIFY_TOKEN: string;
		PUBSUBHUBBUB_SECRET: string;
	}
}
