import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { type AddToQueueDto } from "./dto/addToQueue.dto";
import { MusicRequestService } from "./music.request.service";
import { MusicService } from "./music.service";
import { MusicStore } from "./music.store";

@Controller("music")
export class MusicController {
	constructor(
		private readonly musicStore: MusicStore,
		private readonly musicService: MusicService,
		private readonly musicRequestService: MusicRequestService,
	) {}

	@Get("song")
	async getCurrentSong() {
		return await this.musicService.getCurrentSong();
	}

	@Get("song/index")
	async getCurrentSongIndex() {
		return await this.musicService.getCurrentSongIndex();
	}

	@Get("queue")
	async getQueue(
		@Query("fromIndex") fromIndex?: number,
		@Query("toIndex") toIndex?: number,
	) {
		return await this.musicService.getQueue(fromIndex, toIndex);
	}

	@Post("queue")
	async addToQueue(@Body() body: AddToQueueDto) {
		await this.musicRequestService.addSongToQueue(body);
	}

	@Get("orders")
	async getOrders() {
		return await this.musicStore.getOrder();
	}
}
