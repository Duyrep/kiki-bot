import {
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MusicEvents } from "@rep/shared/events";
import { WebSocket } from "ws";
import type { EnvironmentVariables } from "@/common/types";

@Injectable()
export class YoutubeMusicService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger("Youtube Music");
	private wsClient!: WebSocket;

	constructor(
		private readonly eventEmitter: EventEmitter2,
		private readonly configService: ConfigService<EnvironmentVariables>,
	) {}

	onModuleInit() {
		this.connect();
	}

	private connect() {
		this.wsClient = new WebSocket(
			`${this.configService.getOrThrow("YOUTUBE_MUSIC_API_SERVER")}/ws`,
		);

		this.wsClient.on("open", () => {
			this.logger.log("connected to the server");
		});

		this.wsClient.on("message", (rawData: string) => {
			const data = JSON.parse(rawData);

			switch (data.type) {
				case "VIDEO_CHANGED":
					this.eventEmitter.emit(MusicEvents.VIDEO_CHANGED, data);
			}
		});

		this.wsClient.on("error", (err) => {
			this.logger.error(err);
		});

		this.wsClient.on("close", () => {
			this.logger.log("disconnected to the server");
			setTimeout(() => this.connect(), 5000);
		});
	}

	onModuleDestroy() {
		if (this.wsClient) this.wsClient.close();
	}
}
