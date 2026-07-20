import { BadRequestException, Injectable, Logger } from "@nestjs/common";
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

interface QueueType {
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

	private viewerOrders: {
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

				const id = videoId
					? `${videoId}_${video?.trackingParams ?? ""}`
					: `empty_${index}`;

				const viewerOrder = videoId
					? this.viewerOrders.find((v) => v.videoId === videoId)
					: undefined;

				return {
					id,
					videoId,
					title: video?.title?.runs?.[0]?.text ?? "unknown",
					author: video?.longBylineText?.runs?.[0]?.text ?? "unknown",
					tag: viewerOrder ? "viewer" : undefined,
					viewerName: viewerOrder?.viewerName,
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

	// async addToTract(body: AddToQueueDto) {
	// 	const maxSongsInQueue =
	// 		Number(this.configService.get<number>("MAX_SONGS_IN_QUEUE")) ?? 10;

	// 	if (this.viewerOrders.length >= maxSongsInQueue + 1) return;

	// 	while (this.isProcessingQueue) {
	// 		await new Promise((resolve) => setTimeout(resolve, 100));
	// 	}
	// 	this.isProcessingQueue = true;

	// 	try {
	// 		const delay = (ms: number) =>
	// 			new Promise((resolve) => setTimeout(resolve, ms));

	// 		let queue = await this.getQueue();
	// 		const currentSong = await this.getCurrentSong();

	// 		if (currentSong && currentSong.videoId === body.videoId) return;

	// 		const currentSongIndex = queue.findIndex(
	// 			(v) => v.videoId === currentSong.videoId,
	// 		);
	// 		const rangeStart = currentSongIndex + 1;
	// 		const rangeEnd = currentSongIndex + maxSongsInQueue + 1;

	// 		const safeZoneTracks = queue.slice(rangeStart, rangeEnd);
	// 		const duplicateInSafeZone = safeZoneTracks.find(
	// 			(v) => v.videoId === body.videoId,
	// 		);

	// 		if (duplicateInSafeZone && duplicateInSafeZone.tag === "viewer") {
	// 			return;
	// 		}

	// 		if (body.viewerName) {
	// 			const now = Date.now();
	// 			const timeWindow = 45 * 1000;
	// 			const maxRequests = 2;

	// 			this.requestHistory = this.requestHistory.filter(
	// 				(req) => now - req.timestamp < timeWindow,
	// 			);

	// 			const viewerRequestsInWindow = this.requestHistory.filter(
	// 				(req) => req.viewerName === body.viewerName,
	// 			);

	// 			if (viewerRequestsInWindow.length >= maxRequests) {
	// 				throw new BadRequestException("TOO MANY REQUEST");
	// 			}

	// 			this.requestHistory.push({
	// 				viewerName: body.viewerName,
	// 				timestamp: now,
	// 			});
	// 		}

	// 		const safeZoneWithIndices = queue
	// 			.map((video, index) => ({ video, index }))
	// 			.slice(rangeStart, rangeEnd);

	// 		const seenVideoIds = new Set<string>();
	// 		const indicesToDelete: number[] = [];

	// 		for (let i = safeZoneWithIndices.length - 1; i >= 0; i--) {
	// 			const item = safeZoneWithIndices[i];
	// 			if (!item) continue;
	// 			const videoId = item.video.videoId;

	// 			if (seenVideoIds.has(videoId)) {
	// 				if (item.video.tag === "viewer") {
	// 					continue;
	// 				}
	// 				indicesToDelete.push(item.index);
	// 			} else {
	// 				seenVideoIds.add(videoId);
	// 			}
	// 		}

	// 		safeZoneWithIndices.forEach((item) => {
	// 			if (
	// 				item.video.videoId === body.videoId &&
	// 				item.video.tag !== "viewer" &&
	// 				!indicesToDelete.includes(item.index)
	// 			) {
	// 				indicesToDelete.push(item.index);
	// 			}
	// 		});

	// 		if (indicesToDelete.length > 0) {
	// 			indicesToDelete.sort((a, b) => b - a);

	// 			for (const indexToDelete of indicesToDelete) {
	// 				try {
	// 					this.delete(indexToDelete);
	// 					await delay(1000);
	// 				} catch (err) {
	// 					this.logger.error(
	// 						`Lỗi không thể xóa bài trùng tại index ${indexToDelete}:`,
	// 						err,
	// 					);
	// 				}
	// 			}

	// 			queue = await this.getQueue();
	// 		}

	// 		const freshSafeZone = queue.slice(rangeStart, rangeEnd);
	// 		const externalDuplicateMovedIn = freshSafeZone.findIndex(
	// 			(v) => v.videoId === body.videoId && v.tag !== "viewer",
	// 		);

	// 		if (externalDuplicateMovedIn !== -1) {
	// 			const absoluteIndexToDelete = rangeStart + externalDuplicateMovedIn;
	// 			try {
	// 				this.delete(absoluteIndexToDelete);
	// 				await delay(1000);
	// 				queue = await this.getQueue();
	// 			} catch (err) {
	// 				this.logger.error(
	// 					`Lỗi xóa bài trùng lặp lọt vào safe zone tại index ${absoluteIndexToDelete}:`,
	// 					err,
	// 				);
	// 			}
	// 		}

	// 		await fetch(
	// 			`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue`,
	// 			{
	// 				method: "POST",
	// 				headers: { "Content-Type": "application/json" },
	// 				body: JSON.stringify({
	// 					videoId: body.videoId,
	// 					insertPosition: "INSERT_AFTER_CURRENT_VIDEO",
	// 				}),
	// 			},
	// 		);

	// 		if (body.viewerName) {
	// 			this.viewerOrders.push({
	// 				videoId: body.videoId,
	// 				viewerName: body.viewerName,
	// 			});
	// 			if (this.viewerOrders.length > 100) this.viewerOrders.shift();
	// 		}

	// 		let updatedQueue = (await this.getQueue()).slice(rangeStart, rangeEnd);

	// 		this.logger.log(
	// 			updatedQueue.length,
	// 			rangeStart,
	// 			rangeEnd,
	// 			typeof rangeEnd,
	// 		);

	// 		let attempts = 0;
	// 		while (
	// 			!updatedQueue.some((v) => v.videoId === body.videoId) &&
	// 			attempts < 10
	// 		) {
	// 			await delay(2000);
	// 			updatedQueue = await this.getQueue();
	// 			attempts++;
	// 		}

	// 		const fromIndex = updatedQueue.findIndex(
	// 			(v) => v.videoId === body.videoId,
	// 		);
	// 		if (fromIndex !== -1) {
	// 			const lastViewerTrack = [...this.viewerOrders]
	// 				.reverse()
	// 				.find(
	// 					(vo) =>
	// 						vo.videoId !== body.videoId &&
	// 						updatedQueue.some((q) => q.videoId === vo.videoId),
	// 				);

	// 			let toIndex = -1;
	// 			if (lastViewerTrack) {
	// 				toIndex = updatedQueue.findIndex(
	// 					(v) => v.videoId === lastViewerTrack.videoId,
	// 				);
	// 			}

	// 			if (toIndex === -1) {
	// 				const latestCurrentSong = await this.getCurrentSong();
	// 				toIndex = updatedQueue.findIndex(
	// 					(v) => v.videoId === latestCurrentSong.videoId,
	// 				);
	// 			}

	// 			let targetIndex = toIndex !== -1 ? toIndex + 1 : 0;
	// 			if (fromIndex < targetIndex) targetIndex--;

	// 			if (fromIndex !== targetIndex) {
	// 				await fetch(
	// 					`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue/${fromIndex}`,
	// 					{
	// 						method: "PATCH",
	// 						headers: { "Content-Type": "application/json" },
	// 						body: JSON.stringify({ toIndex: targetIndex }),
	// 					},
	// 				);
	// 			}
	// 		}
	// 	} catch (error) {
	// 		this.logger.error("addToTract:", error);
	// 		throw error;
	// 	} finally {
	// 		this.isProcessingQueue = false;
	// 	}
	// }

	async delete(indexToDelete: number) {
		await fetch(
			`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue/${indexToDelete}`,
			{
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	async addSongToQueue2(body: AddToQueueDto) {
		if (this.viewerOrders.some((v) => v.videoId === body.videoId)) return;

		const timeWindow = 45 * 1000;
		const now = Date.now();

		const recentOrdersByUser = this.viewerOrders.filter(
			(v) => v.viewerName === body.viewerName && now - v.createdAt < timeWindow,
		);

		if (recentOrdersByUser.length >= 2) {
			return;
		}

		const currentSong = await this.getCurrentSong();

		if (body.videoId === currentSong.videoId) return;

		const maxSongInQueue = this.configService.get("MAX_SONGS_IN_QUEUE") ?? 10;

		if (this.viewerOrders.length >= maxSongInQueue) return;

		const currentSongIndex = await this.getCurrentSongIndex();

		let queue = await this.getQueue(currentSongIndex + 1, maxSongInQueue + 1);

		while (queue.some((v) => v.videoId === body.videoId)) {
			const target = queue.find((v) => v.videoId === body.videoId);
			if (target && target.index !== undefined) {
				const _queue = await this.getQueue();
				await this.delete(target.index);
				await this.waitForQueueUpdate(_queue);
			}
			queue = await this.getQueue(currentSongIndex + 1, maxSongInQueue + 1);
		}

		let _queue = await this.getQueue();

		await this.addSongToQueue({
			videoId: body.videoId,
			insertPosition: InsertPosition.INSERT_AFTER_CURRENT_VIDEO,
		});

		await this.waitForQueueUpdate(_queue);

		if (this.viewerOrders.length > 0) {
			queue = await this.getQueue(currentSongIndex + 1, maxSongInQueue + 1);

			const fromIndex = queue.find((v) => v.videoId === body.videoId)?.index;

			const toIndex = queue.find(
				(v) => v.videoId === this.viewerOrders.at(-1)?.videoId,
			)?.index;

			this.logger.log(fromIndex, toIndex);

			if (!fromIndex || !toIndex) return;
			await fetch(
				`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue/${fromIndex}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ toIndex }),
				},
			);
		}

		_queue = await this.getQueue();
		this.viewerOrders.push({
			videoId: body.videoId,
			viewerName: body.viewerName,
			createdAt: Date.now(),
		});
		await this.waitForQueueUpdate(_queue);
	}

	private async waitForQueueUpdate(
		initialQueue: QueueType[],
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
		const currentSong = await this.getCurrentSong();
		const currentSongIndex = queue.findIndex(
			(v) => v.videoId === currentSong.videoId,
		);

		const zone = queue.slice(
			currentSongIndex + 1,
			currentSongIndex + maxSongsInQueue + 1,
		);

		for (let i = this.viewerOrders.length - 1; i >= 0; i--) {
			const currentOrder = this.viewerOrders.at(i);

			const isInZone = zone.some(
				(zoneItem) => zoneItem.videoId === currentOrder?.videoId,
			);

			if (!isInZone) {
				this.viewerOrders.splice(i, 1);
			}
		}
	}

	@Interval(1000)
	async updateQueuePolling() {
		try {
			const data = (await this.getQueue()).map((v) => v.videoId);
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
