import { Command } from "@/core";
import { connection } from "@/index";
import { type SearchResponse } from "@/interfaces";

export default class Search extends Command implements Command {
	constructor() {
		super("ki!p");
	}

	async run(...args: string[]) {
		const username = args.at(0);
		const query = args.slice(1).join(" ");

		if (!query || !username) return;

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
					`[searchResponse] ${searchResponse.status} ${searchResponse.statusText}`,
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

			if (!queueResponse.ok)
				throw new Error(
					`[queueResponse] ${queueResponse.status} ${queueResponse.statusText}`,
				);

			if (!connection.options.authenticateWs) {
				console.log(`${username} vừa mới thêm nhạc ${songInfo?.songAndArtist}`);
				return;
			}
		} catch (e) {
			console.error(e);
		}
	}

	getFirstSongOrVideoInfo(data: SearchResponse):
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
