export interface QueueItem {
	id: string;
	videoId: string;
	title: string;
	author: string;
	tag?: string;
	viewerName?: string;
	selected: boolean;
	index: number;
}
