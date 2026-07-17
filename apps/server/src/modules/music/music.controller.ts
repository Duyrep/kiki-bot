import { Body, Controller, Get, Post } from "@nestjs/common";
import type { AddToQueueDto } from "./dto/addToQueue.dto";
import { MusicService } from "./music.service";

@Controller("music")
export class MusicController {
	constructor(private readonly musicService: MusicService) {}

	@Get("queue")
	async getQueue() {
		return await this.musicService.getQueue();
	}

	@Post("queue")
	async addToQueue(@Body() body: AddToQueueDto) {
		await this.musicService.addToTract(body);
	}
}
