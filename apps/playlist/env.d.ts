declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: "development" | "production";

		NEXT_PUBLIC_UPCOMING_SONGS: string;
		NEXT_PUBLIC_SPECIAL_VIEWER: string;
		NEXT_PUBLIC_BACKEND_URL: string;
		NEXT_PUBLIC_WEBSOCKET_URL: string;
		NEXT_PUBLIC_YOUTUBE_MUSIC_API_SERVER: string;
	}
}
