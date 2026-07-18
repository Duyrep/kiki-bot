import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
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

		return data.items.map((item) => ({
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
		while (this.isProcessingQueue) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		this.isProcessingQueue = true;

		try {
			const delay = (ms: number) =>
				new Promise((resolve) => setTimeout(resolve, ms));

			const queue = await this.getQueue();
			const currentSong = await this.getCurrentSong();

			const currentSongIndex = queue.findIndex(
				(v) => v.videoId === currentSong.videoId,
			);
			const rangeStart = currentSongIndex + 1;
			const rangeEnd = currentSongIndex + 11;

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

			if (duplicateInSafeZone) {
				const indexInQueue = queue.findIndex(
					(v, idx) =>
						idx >= rangeStart && idx < rangeEnd && v.videoId === body.videoId,
				);
				if (indexInQueue !== -1) {
					await fetch(
						`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue/${indexInQueue}`,
						{
							method: "DELETE",
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			} else {
				const duplicateOutsideIndex = queue.findIndex(
					(v, idx) =>
						v.videoId === body.videoId && (idx < rangeStart || idx >= rangeEnd),
				);
				if (duplicateOutsideIndex !== -1) {
					await fetch(
						`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue/${duplicateOutsideIndex}`,
						{
							method: "DELETE",
							headers: { "Content-Type": "application/json" },
						},
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

			let updatedQueue = await this.getQueue();
			let attempts = 0;
			while (
				!updatedQueue.some((v) => v.videoId === body.videoId) &&
				attempts < 10
			) {
				await delay(3000);
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
	}
}
