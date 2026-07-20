import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { Interval } from "@nestjs/schedule";
import { MusicEvents } from "@rep/shared/events";
import * as murmur from "murmurhash3js";
import type { QueueResponse } from "@/common/interfaces";
import type { EnvironmentVariables } from "@/common/types";
import {
	type AddSongToQueueDto,
	InsertPosition,
} from "./dto/addSongToQueue.dto";
import type { AddToQueueDto } from "./dto/addToQueue.dto";

interface QueueItem {
	videoId: string;
	title: string;
	author: string;
	index: number;
	selected: boolean;
	tag?: string | undefined;
	viewerName?: string | undefined;
}

@Injectable()
export class MusicService {
	private readonly logger = new Logger("MusicService");

	public viewerOrders: {
		id: string;
		videoId: string;
		viewerName: string;
		createdAt: number;
	}[] = [];
	private previousQueueLength: number = 0;
	private previousQueueHash: number = 0;

	constructor(
		private readonly eventEmitter: EventEmitter2,
		private readonly configService: ConfigService<EnvironmentVariables>,
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

				const order = this.viewerOrders.find((v) => v.id === id);

				return {
					id,
					videoId,
					orderId: order?.id,
					title: video?.title?.runs?.[0]?.text ?? "unknown",
					author: video?.longBylineText?.runs?.[0]?.text ?? "unknown",
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

	async addSongToQueue3(body: AddToQueueDto) {
		const maxSongInQueue = this.configService.get("MAX_SONGS_IN_QUEUE") ?? 500;
		if (this.viewerOrders.length >= maxSongInQueue) return;

		const timeWindow = 45 * 1000;
		const now = Date.now();

		const recentOrdersByUser = this.viewerOrders.filter(
			(v) => v.viewerName === body.viewerName && now - v.createdAt < timeWindow,
		);

		if (recentOrdersByUser.length >= 2) {
			return;
		}

		const currentSongIndex = await this.getCurrentSongIndex();

		const _queue = await this.getQueue();
		await this.addSongToQueue({
			videoId: body.videoId,
			insertPosition: InsertPosition.INSERT_AFTER_CURRENT_VIDEO,
		});
		await this.waitForQueueUpdate(_queue);

		const queue = await this.getQueue();
		let youtubeItemId = queue.at(currentSongIndex + 1)?.id ?? "";

		if (this.viewerOrders.length > 0) {
			let queue = await this.getQueue(currentSongIndex + 1, maxSongInQueue + 1);

			const fromIndex = currentSongIndex + 1;

			const viewerQueue = queue.filter((v) => v.tag === "viewer");
			const toIndex = viewerQueue.at(-1)?.index;

			if (!fromIndex || !toIndex) return;

			const _queue = await this.getQueue();
			await fetch(
				`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue/${fromIndex}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ toIndex }),
				},
			);
			await this.waitForQueueUpdate(_queue);

			queue = await this.getQueue();
			youtubeItemId = queue.at(toIndex)?.id ?? "";
			console.log(toIndex, queue.at(toIndex));
		}

		this.viewerOrders.push({
			id: youtubeItemId,
			videoId: body.videoId,
			viewerName: body.viewerName,
			createdAt: Date.now(),
		});
	}

	private async waitForQueueUpdate(
		initialQueue: QueueItem[],
		maxAttempts: number = 10,
		delayMs: number = 300,
	) {
		const delay = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms));

		const originalLength = initialQueue?.length ?? 0;
		const originalHash = murmur.x64.hash128(JSON.stringify(initialQueue));

		let attempts = 0;

		while (attempts < maxAttempts) {
			const currentQueue = await this.getQueue();
			const currentLength = currentQueue?.length ?? 0;

			if (currentLength !== originalLength) {
				return currentQueue;
			}

			const currentHash = murmur.x64.hash128(JSON.stringify(currentQueue));
			if (currentHash !== originalHash) {
				return currentQueue;
			}

			attempts++;
			await delay(delayMs);
		}

		return null;
	}

	@OnEvent(MusicEvents.VIDEO_CHANGED)
	async handleVideoChanged() {
		const maxSongsInQueue =
			this.configService.get<number>("MAX_SONGS_IN_QUEUE") ?? 10;
		const queue = await this.getQueue();
		const currentSongIndex = await this.getCurrentSongIndex();

		const zone = queue.slice(
			currentSongIndex + 1,
			currentSongIndex + maxSongsInQueue + 1,
		);

		const activeOrderIds = zone.map((v) => v.orderId).filter((v) => v);

		this.viewerOrders = this.viewerOrders.filter((v) =>
			activeOrderIds.includes(v.id),
		);
	}

	@Interval(1000)
	async updateQueuePolling() {
		try {
			const data = (await this.getQueue()).map((v) => v.id);
			const stableString = JSON.stringify(data);
			const queueHash = murmur.x86.hash32(stableString);

			if (
				data.length === this.previousQueueLength &&
				this.previousQueueHash === queueHash
			)
				return;

			this.eventEmitter.emit(MusicEvents.QUEUE_UPDATE, {
				length: data.length,
			});

			this.logger.log("QUEUE_UPDATE");

			this.previousQueueLength = data.length;
			this.previousQueueHash = queueHash;
		} catch (error) {
			this.logger.error("Kết nối thất bại. Vui lòng bật YouTube Music!");
		}
	}
}
