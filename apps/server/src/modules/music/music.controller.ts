import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { type AddToQueueDto, InsertPosition } from "./dto/addToQueue.dto";
import { MusicService } from "./music.service";

@Controller("music")
export class MusicController {
	constructor(private readonly musicService: MusicService) {}

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

	@Get("test")
	async test() {
		return this.musicService.viewerOrders;
	}

	@Post("queue")
	async addToQueue(@Body() body: AddToQueueDto) {
		await this.musicService.addSongToQueue3(body);
	}
}
