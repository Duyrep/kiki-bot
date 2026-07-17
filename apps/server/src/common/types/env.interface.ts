export default interface EnvironmentVariables {
	NODE_ENV: "development" | "production";

	PORT: number;
	SERVER_URL: string;

	PLAYLIST_URL: string;
	YOUTUBE_MUSIC_API_SERVER: string;
}
