import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { Interval } from "@nestjs/schedule";
import { MusicEvents } from "@rep/shared/events";
import * as murmur from "murmurhash3js";
import type { QueueResponse } from "@/common/interfaces";
import type { EnvironmentVariables } from "@/common/types";
import type { AddToQueueDto } from "./dto/addToQueue.dto";

@Injectable()
export class MusicService {
	private readonly logger = new Logger(MusicService.name);

	private viewerOrders: { videoId: string; viewerName: string }[] = [];
	private previousQueueLength: number = 0;
	private previousQueueHash: string = "";

	private isProcessingQueue = false;

	private requestHistory: { viewerName: string; timestamp: number }[] = [];

	constructor(
		private readonly eventEmitter: EventEmitter2,
		private readonly configService: ConfigService<EnvironmentVariables>,
	) {}

	async getQueue() {
		const response = await fetch(
			`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue`,
			{
				method: "GET",
			},
		);

		const data = (await response.json()) as QueueResponse;

		return data.items.map((item, index) => ({
			videoId:
				item.playlistPanelVideoWrapperRenderer?.primaryRenderer
					.playlistPanelVideoRenderer.videoId ??
				item.playlistPanelVideoRenderer?.videoId ??
				"",
			title:
				item.playlistPanelVideoWrapperRenderer?.primaryRenderer?.playlistPanelVideoRenderer.title.runs?.at(
					0,
				)?.text ??
				item.playlistPanelVideoRenderer?.title.runs?.at(0)?.text ??
				"unknown",
			author:
				item.playlistPanelVideoWrapperRenderer?.primaryRenderer.playlistPanelVideoRenderer.longBylineText.runs?.at(
					0,
				)?.text ??
				item.playlistPanelVideoRenderer?.longBylineText.runs?.at(0)?.text ??
				"unknown",
			tag: this.viewerOrders.some(
				(v) =>
					v.videoId ===
						item.playlistPanelVideoWrapperRenderer?.primaryRenderer
							.playlistPanelVideoRenderer.videoId ||
					v.videoId === item.playlistPanelVideoRenderer?.videoId,
			)
				? "viewer"
				: undefined,
			viewerName: this.viewerOrders.find(
				(v) =>
					v.videoId ===
						item.playlistPanelVideoWrapperRenderer?.primaryRenderer
							.playlistPanelVideoRenderer.videoId ||
					v.videoId === item.playlistPanelVideoRenderer?.videoId,
			)?.viewerName,
			index,
		}));
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

	async addToTract(body: AddToQueueDto) {
		const maxSongsInQueue =
			Number(this.configService.get<number>("MAX_SONGS_IN_QUEUE")) ?? 10;

		if (this.viewerOrders.length >= maxSongsInQueue + 1) return;

		while (this.isProcessingQueue) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		this.isProcessingQueue = true;

		try {
			const delay = (ms: number) =>
				new Promise((resolve) => setTimeout(resolve, ms));

			let queue = await this.getQueue();
			const currentSong = await this.getCurrentSong();

			if (currentSong && currentSong.videoId === body.videoId) return;

			const currentSongIndex = queue.findIndex(
				(v) => v.videoId === currentSong.videoId,
			);
			const rangeStart = currentSongIndex + 1;
			const rangeEnd = currentSongIndex + maxSongsInQueue + 1;

			const safeZoneTracks = queue.slice(rangeStart, rangeEnd);
			const duplicateInSafeZone = safeZoneTracks.find(
				(v) => v.videoId === body.videoId,
			);

			if (duplicateInSafeZone && duplicateInSafeZone.tag === "viewer") {
				return;
			}

			if (body.viewerName) {
				const now = Date.now();
				const timeWindow = 45 * 1000;
				const maxRequests = 2;

				this.requestHistory = this.requestHistory.filter(
					(req) => now - req.timestamp < timeWindow,
				);

				const viewerRequestsInWindow = this.requestHistory.filter(
					(req) => req.viewerName === body.viewerName,
				);

				if (viewerRequestsInWindow.length >= maxRequests) {
					throw new BadRequestException("TOO MANY REQUEST");
				}

				this.requestHistory.push({
					viewerName: body.viewerName,
					timestamp: now,
				});
			}

			const safeZoneWithIndices = queue
				.map((video, index) => ({ video, index }))
				.slice(rangeStart, rangeEnd);

			const seenVideoIds = new Set<string>();
			const indicesToDelete: number[] = [];

			for (let i = safeZoneWithIndices.length - 1; i >= 0; i--) {
				const item = safeZoneWithIndices[i];
				if (!item) continue;
				const videoId = item.video.videoId;

				if (seenVideoIds.has(videoId)) {
					if (item.video.tag === "viewer") {
						continue;
					}
					indicesToDelete.push(item.index);
				} else {
					seenVideoIds.add(videoId);
				}
			}

			safeZoneWithIndices.forEach((item) => {
				if (
					item.video.videoId === body.videoId &&
					item.video.tag !== "viewer" &&
					!indicesToDelete.includes(item.index)
				) {
					indicesToDelete.push(item.index);
				}
			});

			if (indicesToDelete.length > 0) {
				indicesToDelete.sort((a, b) => b - a);

				for (const indexToDelete of indicesToDelete) {
					try {
						this.delete(indexToDelete);
						await delay(1000);
					} catch (err) {
						this.logger.error(
							`Lỗi không thể xóa bài trùng tại index ${indexToDelete}:`,
							err,
						);
					}
				}

				queue = await this.getQueue();
			}

			const freshSafeZone = queue.slice(rangeStart, rangeEnd);
			const externalDuplicateMovedIn = freshSafeZone.findIndex(
				(v) => v.videoId === body.videoId && v.tag !== "viewer",
			);

			if (externalDuplicateMovedIn !== -1) {
				const absoluteIndexToDelete = rangeStart + externalDuplicateMovedIn;
				try {
					this.delete(absoluteIndexToDelete);
					await delay(1000);
					queue = await this.getQueue();
				} catch (err) {
					this.logger.error(
						`Lỗi xóa bài trùng lặp lọt vào safe zone tại index ${absoluteIndexToDelete}:`,
						err,
					);
				}
			}

			await fetch(
				`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						videoId: body.videoId,
						insertPosition: "INSERT_AFTER_CURRENT_VIDEO",
					}),
				},
			);

			if (body.viewerName) {
				this.viewerOrders.push({
					videoId: body.videoId,
					viewerName: body.viewerName,
				});
				if (this.viewerOrders.length > 100) this.viewerOrders.shift();
			}

			let updatedQueue = (await this.getQueue()).slice(rangeStart, rangeEnd);

			this.logger.log(
				updatedQueue.length,
				rangeStart,
				rangeEnd,
				typeof rangeEnd,
			);

			let attempts = 0;
			while (
				!updatedQueue.some((v) => v.videoId === body.videoId) &&
				attempts < 10
			) {
				await delay(2000);
				updatedQueue = await this.getQueue();
				attempts++;
			}

			const fromIndex = updatedQueue.findIndex(
				(v) => v.videoId === body.videoId,
			);
			if (fromIndex !== -1) {
				const lastViewerTrack = [...this.viewerOrders]
					.reverse()
					.find(
						(vo) =>
							vo.videoId !== body.videoId &&
							updatedQueue.some((q) => q.videoId === vo.videoId),
					);

				let toIndex = -1;
				if (lastViewerTrack) {
					toIndex = updatedQueue.findIndex(
						(v) => v.videoId === lastViewerTrack.videoId,
					);
				}

				if (toIndex === -1) {
					const latestCurrentSong = await this.getCurrentSong();
					toIndex = updatedQueue.findIndex(
						(v) => v.videoId === latestCurrentSong.videoId,
					);
				}

				let targetIndex = toIndex !== -1 ? toIndex + 1 : 0;
				if (fromIndex < targetIndex) targetIndex--;

				if (fromIndex !== targetIndex) {
					await fetch(
						`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue/${fromIndex}`,
						{
							method: "PATCH",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ toIndex: targetIndex }),
						},
					);
				}
			}
		} catch (error) {
			this.logger.error("addToTract:", error);
			throw error;
		} finally {
			this.isProcessingQueue = false;
		}
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
		const data = await this.getQueue();
		const stableString = JSON.stringify(data);
		const queueHash = murmur.x64.hash128(stableString);

		if (
			data.length === this.previousQueueLength &&
			this.previousQueueHash === queueHash
		)
			return;

		this.eventEmitter.emit(MusicEvents.QUEUE_UPDATE, {
			length: data.length,
		});

		if (data.length > this.previousQueueLength) {
			const playlist = data.at(-1);
			this.eventEmitter.emit(MusicEvents.TRACK_ADD, {
				videoId: playlist?.videoId ?? "unknown",
				title: playlist?.title ?? "unknown",
				author: playlist?.author ?? "unknown",
				tag: this.viewerOrders.some((v) => v.videoId === playlist?.videoId)
					? "viewer"
					: undefined,
			});
		}

		this.previousQueueLength = data.length;
		this.previousQueueHash = queueHash;
	}
}
