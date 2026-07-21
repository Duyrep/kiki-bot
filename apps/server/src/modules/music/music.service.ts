import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { QueueResponse } from "@/common/interfaces";
import type { EnvironmentVariables } from "@/common/types";
import { type AddSongToQueueDto } from "./dto/addSongToQueue.dto";
import { MusicStore } from "./music.store";

export interface QueueItem {
	videoId: string;
	title: string;
	artist: string;
	index: number;
	selected: boolean;
	tag?: string | undefined;
	viewerName?: string | undefined;
}

@Injectable()
export class MusicService {
	constructor(
		private readonly configService: ConfigService<EnvironmentVariables>,
		private readonly musicStore: MusicStore,
	) {}

	async getQueue(fromIndex?: number, toIndex?: number) {
		const response = await fetch(
			`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue`,
			{
				method: "GET",
			},
		);

		const data = (await response.json()) as QueueResponse;

		return data.items
			.map((item, index) => {
				const video =
					item.playlistPanelVideoWrapperRenderer?.primaryRenderer
						?.playlistPanelVideoRenderer || item.playlistPanelVideoRenderer;

				const videoId = video?.videoId ?? "";

				const id =
					video?.menu.menuRenderer.items.find(
						(v) => v.menuServiceItemRenderer?.icon.iconType === "REMOVE",
					)?.menuServiceItemRenderer?.serviceEndpoint?.removeFromQueueEndpoint
						?.itemId ?? `empty_${index}`;

				const order = this.musicStore.getOrder().find((v) => v.id === id);

				return {
					id,
					videoId,
					orderId: order?.id,
					title: video?.title?.runs?.[0]?.text ?? "unknown",
					artist: video?.longBylineText?.runs?.[0]?.text ?? "unknown",
					viewerName: order?.viewerName,
					tag: order ? "viewer" : undefined,
					selected: video?.selected ?? false,
					index,
				};
			})
			.slice(fromIndex, toIndex);
	}

	async getCurrentSong() {
		const response = await fetch(
			`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/song`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		return (await response.json()) as { videoId: string };
	}

	async getCurrentSongIndex() {
		return (await this.getQueue()).findIndex((v) => v.selected);
	}

	async addSongToQueue(body: AddSongToQueueDto) {
		await fetch(
			`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			},
		);
	}

	async delete(indexToDelete: number) {
		await fetch(
			`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue/${indexToDelete}`,
			{
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
