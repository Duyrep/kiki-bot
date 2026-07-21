import { Module } from "@nestjs/common";
import { MusicController } from "./music.controller";
import { MusicRequestService } from "./music.request.service";
import { MusicService } from "./music.service";
import { MusicStore } from "./music.store";
import { YoutubeMusicService } from "./music.youtube.service";

@Module({
	controllers: [MusicController],
	providers: [
		MusicService,
		MusicRequestService,
		MusicStore,
		YoutubeMusicService,
	],
})
export class MusicModule {}
