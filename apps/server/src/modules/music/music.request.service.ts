import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Interval } from "@nestjs/schedule";
import { MusicEvents } from "@rep/shared/events";
import * as murmur from "murmurhash3js";
import { InsertPosition } from "./dto/addSongToQueue.dto";
import type { AddToQueueDto } from "./dto/addToQueue.dto";
import { MusicService, type QueueItem } from "./music.service";
import { MusicStore } from "./music.store";

@Injectable()
export class MusicRequestService {
	private readonly logger = new Logger("MusicRequestService");

	private previousQueueLength: number = 0;
	private previousQueueHash: number = 0;

	constructor(
		private readonly configService: ConfigService,
		private readonly eventEmitter: EventEmitter2,
		private readonly musicService: MusicService,
		private readonly musicStore: MusicStore,
	) {}

	async addSongToQueue(body: AddToQueueDto) {
		const maxSongInQueue =
			this.configService.get("MAX_SONGS_IN_QUEUE") ?? 500000;
		if (this.musicStore.getOrderLength() >= maxSongInQueue) return;

		const timeWindow = 45 * 1000;
		const now = Date.now();

		const recentOrdersByUser = this.musicStore
			.getOrder()
			.filter(
				(v) =>
					v.viewerName === body.viewerName && now - v.createdAt < timeWindow,
			);

		if (recentOrdersByUser.length >= 2) {
			return;
		}

		const currentSongIndex = await this.musicService.getCurrentSongIndex();

		const _queue = await this.musicService.getQueue();
		await this.musicService.addSongToQueue({
			videoId: body.videoId,
			insertPosition: InsertPosition.INSERT_AFTER_CURRENT_VIDEO,
		});
		await this.waitForQueueUpdate(_queue);

		const queue = await this.musicService.getQueue();
		let youtubeItemId = queue.at(currentSongIndex + 1)?.id ?? "";

		if (this.musicStore.getOrderLength() > 0) {
			let queue = await this.musicService.getQueue(
				currentSongIndex + 1,
				maxSongInQueue + 1,
			);

			const fromIndex = currentSongIndex + 1;

			const viewerQueue = queue.filter((v) => v.tag === "viewer");
			const toIndex = viewerQueue.at(-1)?.index;

			if (!fromIndex || !toIndex) return;

			const _queue = await this.musicService.getQueue();
			await fetch(
				`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue/${fromIndex}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ toIndex }),
				},
			);
			await this.waitForQueueUpdate(_queue);

			queue = await this.musicService.getQueue();
			youtubeItemId = queue.at(toIndex)?.id ?? "";
		}

		this.logger.log(`Vừa thêm nhạc của ${body.viewerName}`);

		this.musicStore.addOrder({
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
			const currentQueue = await this.musicService.getQueue();
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

	@Interval(1000)
	async updateQueuePolling() {
		try {
			const data = (await this.musicService.getQueue()).map((v) => v.id);
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

			this.previousQueueLength = data.length;
			this.previousQueueHash = queueHash;
		} catch {
			this.logger.error("Kết nối thất bại. Vui lòng bật YouTube Music!");
		}
	}
}
