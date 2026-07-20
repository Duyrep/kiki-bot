export type VideoType =
	| "AUDIO"
	| "ORIGINAL_MUSIC_VIDEO"
	| "USER_GENERATED_CONTENT"
	| "PODCAST_EPISODE"
	| "OTHER_VIDEO";

export interface Song {
	title: string;
	artist: string;
	views: number;
	uploadDate: string;
	isPaused: boolean;
	songDuration: number;
	elapsedSeconds: number;
	url: string;
	videoId: string;
	playlistId: string;
	type: VideoType[];
}
