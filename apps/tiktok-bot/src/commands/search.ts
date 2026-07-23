import { Command } from "@/core";
import { type SearchResponse } from "@/interfaces";
import { logger } from "@/utils";

export default class Search extends Command implements Command {
	private static queue: Promise<void> = Promise.resolve();

	constructor() {
		super("ki!p");
	}

	run(...args: string[]): void {
		Search.queue = Search.queue
			.then(() => this.executeSearch(...args))
			.catch((err) =>
				logger.error(
					{
						context: "SearchCommand",
						error: err instanceof Error ? err.message : String(err),
					},
					"Lỗi trong hàng đợi Search",
				),
			);
	}

	private async executeSearch(...args: string[]): Promise<void> {
		const username = args.at(0);
		const query = args.slice(1).join(" ");

		if (!query || !username) return;
		const start = performance.now();

		try {
			const searchResponse = await fetch(
				`${process.env.YOUTUBE_MUSIC_API_SERVER}/search`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ query }),
				},
			);

			if (!searchResponse.ok)
				throw new Error(
					`${searchResponse.status} ${searchResponse.statusText}`,
				);

			const data = (await searchResponse.json()) as SearchResponse;
			const songInfo = this.getFirstSongOrVideoInfo(data);

			if (!songInfo) return;

			const queueResponse = await fetch(
				`${process.env.SERVER_URL}/music/queue`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						videoId: songInfo.videoId,
						insertPosition: "INSERT_AFTER_END_OF_VIEWERS_VIDEO",
						tag: "viewer",
						viewerName: username,
					}),
				},
			);

			const end = performance.now();
			const duration = end - start;

			if (!queueResponse.ok) {
				logger.error(
					{
						context: "SearchCommand",
					},
					`${((await queueResponse.json()) as { message: string }).message} (${duration > 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration.toFixed(1)}ms`}). Bạn ấy muốn thêm bài ${songInfo.songAndArtist}`,
				);
				return;
			}

			logger.info(
				{
					context: "SearchCommand",
				},
				`Đã thêm bài ${songInfo.songAndArtist} của @${username} trong ${duration > 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration.toFixed(1)}ms`}`,
			);
		} catch (e) {
			const end = performance.now();
			const duration = end - start;
			logger.error(
				{ context: "SearchCommand" },
				`Lỗi khi xử lý yêu cầu tìm kiếm của @${username} \n${e} \n ${duration > 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration.toFixed(1)}ms`}`,
			);
		}
	}

	private getFirstSongOrVideoInfo(data: SearchResponse):
		| {
				videoId: string;
				songAndArtist: string;
		  }
		| undefined {
		const contents =
			data.contents.tabbedSearchResultsRenderer.tabs[0]?.tabRenderer.content
				.sectionListRenderer.contents;

		if (!contents) return;

		for (const content of contents) {
			const videoId =
				content.musicCardShelfRenderer?.buttons[0]?.buttonRenderer.command
					.watchEndpoint?.videoId ??
				content.itemSectionRenderer?.contents[0]
					?.musicResponsiveListItemRenderer?.overlay
					?.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer
					.playNavigationEndpoint.watchEndpoint?.videoId;

			if (!videoId) continue;

			const songAndArtist =
				content.musicCardShelfRenderer?.thumbnailOverlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.accessibilityPlayData.accessibilityData.label
					.split(" ")
					.slice(1)
					.join(" ") ??
				content.itemSectionRenderer?.contents[0]?.musicResponsiveListItemRenderer.overlay?.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.accessibilityPlayData.accessibilityData.label
					.split(" ")
					.slice(1)
					.join(" ");
			if (!songAndArtist) continue;

			return { videoId, songAndArtist };
		}
	}
}
