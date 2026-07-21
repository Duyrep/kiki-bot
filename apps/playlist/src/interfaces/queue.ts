export interface QueueItem {
	id: string;
	videoId: string;
	title: string;
	artist: string;
	tag?: string;
	viewerName?: string;
	selected: boolean;
	index: number;
}
