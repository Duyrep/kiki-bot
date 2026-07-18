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
		console.log("=== START ADD TO TRACK ===", body);
		const delay = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms));

		const queue = await this.getQueue();
		const currentSong = await this.getCurrentSong();
		const currentSongIndex = queue.findIndex(
			(v) => v.videoId === currentSong.videoId,
		);

		console.log(
			`Queue length: ${queue.length}, Current Song ID: ${currentSong.videoId}, Current Song Index: ${currentSongIndex}`,
		);

		const subQueue = queue.slice(currentSongIndex, currentSongIndex + 11);
		const isDuplicateInSub = subQueue.some((v) => v.videoId === body.videoId);

		console.log(
			`Checking duplicate in next 11 songs: ${isDuplicateInSub ? "FOUND" : "NOT FOUND"}`,
		);

		if (isDuplicateInSub) {
			console.log(
				`[BLOCKED] Video ${body.videoId} already exists in the next 11 songs. Aborting.`,
			);
			return;
		}

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

		console.log(`Current viewerOrders length: ${this.viewerOrders.length}`);

		if (this.viewerOrders.length === 0) {
			console.log("Executing: INSERT_AFTER_CURRENT_VIDEO");
			const res = await fetch(
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
			console.log(`POST Status (Viewer length 0): ${res.status}`);
		} else {
			console.log("Executing: INSERT_AFTER_END_OF_VIEWERS_VIDEO");
			const res = await fetch(
				`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/queue`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						videoId: body.videoId,
					}),
				},
			);
			console.log(`POST Status (Viewer length > 0): ${res.status}`);

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
			console.log(`Found added song in updatedQueue at index: ${fromIndex}`);

			if (fromIndex !== -1) {
				const latestCurrentSong = await this.getCurrentSong();
				const currentSongIdxInUpdated = updatedQueue.findIndex(
					(v) => v.videoId === latestCurrentSong.videoId,
				);

				const remainingQueue = updatedQueue.slice(
					currentSongIdxInUpdated !== -1 ? currentSongIdxInUpdated : 0,
				);

				const viewerSongsCount = remainingQueue.filter(
					(v) => v.tag === "viewer" && v.videoId !== body.videoId,
				).length;

				const baseIndex =
					currentSongIdxInUpdated !== -1 ? currentSongIdxInUpdated : 0;
				const targetIndex = baseIndex + viewerSongsCount + 1;

				console.log(
					`[FIX] Current Song Index: ${baseIndex}, Viewer songs ahead: ${viewerSongsCount}, Target Index: ${targetIndex}`,
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
			console.log(
				`Added to viewerOrders array. New length: ${this.viewerOrders.length}`,
			);
		}

		console.log("=== END ADD TO TRACK ===");
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
