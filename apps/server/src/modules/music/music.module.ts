import { Module } from "@nestjs/common";
import { MusicController } from "./music.controller";
import { MusicService } from "./music.service";
import { YoutubeMusicService } from "./music.youtube.service";

@Module({
	controllers: [MusicController],
	providers: [MusicService, YoutubeMusicService],
})
export class MusicModule {}
