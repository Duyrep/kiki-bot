import { Injectable } from "@nestjs/common";
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
	private readonly viewerOrders: { videoId: string; viewerName: string }[] = [];
	private previousQueueLength: number = 0;
	private previousQueueHash: string = "";

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
		const delay = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms));

		const queue = await this.getQueue();
		const currentSong = await this.getCurrentSong();
		const currentSongIndex = queue.findIndex(
			(v) => v.videoId === currentSong.videoId,
		);

		const isDuplicateInWholeQueue = queue.some(
			(v) => v.videoId === body.videoId,
		);
		console.log(
			`Checking duplicate in whole queue: ${isDuplicateInWholeQueue ? "FOUND" : "NOT FOUND"}`,
		);

		if (isDuplicateInWholeQueue) {
			const index = queue
				.slice(currentSongIndex)
				.findIndex((v) => v.videoId === body.videoId);

			console.log(
				`Deleting duplicate video ${body.videoId} at offset index ${index}`,
			);

			await fetch(
				`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue/${index}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}

		await fetch(
			`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					videoId: body.videoId,
					insertPosition: "INSERT_AFTER_CURRENT_VIDEO",
				}),
			},
		);

		if (this.viewerOrders.length > 0) {
			let updatedQueue = await this.getQueue();
			let attempts = 0;
			const maxAttempts = 10;
			const delayMs = 300;

			while (
				!updatedQueue.some((v) => v.videoId === body.videoId) &&
				attempts < maxAttempts
			) {
				console.log(
					`Waiting for song to appear in queue... Attempt: ${attempts + 1}`,
				);
				await delay(delayMs);
				updatedQueue = await this.getQueue();
				attempts++;
			}

			const fromIndex = updatedQueue.findIndex(
				(v) => v.videoId === body.videoId,
			);

			if (fromIndex !== -1) {
				const lastViewerVideoId = this.viewerOrders.at(-1)?.videoId;
				let toIndex = updatedQueue.findIndex(
					(v) => v.videoId === lastViewerVideoId,
				);

				if (toIndex === -1) {
					const latestCurrentSong = await this.getCurrentSong();
					toIndex = updatedQueue.findIndex(
						(v) => v.videoId === latestCurrentSong.videoId,
					);
				}

				let targetIndex = toIndex !== -1 ? toIndex + 1 : 0;

				if (fromIndex < targetIndex) {
					targetIndex--;
				}

				if (fromIndex !== targetIndex) {
					console.log(
						`Moving song from index ${fromIndex} to target index ${targetIndex}`,
					);
					await fetch(
						`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue/${fromIndex}`,
						{
							method: "PATCH",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								toIndex: targetIndex,
							}),
						},
					);
				}
			} else {
				console.log(
					"Error: Could not find the newly added song in queue after max attempts.",
				);
			}
		}

		if (body.tag === "viewer") {
			this.viewerOrders.push({
				videoId: body.videoId,
				viewerName: body.viewerName,
			});
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
