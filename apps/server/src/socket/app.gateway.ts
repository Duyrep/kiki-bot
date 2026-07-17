import { OnEvent } from "@nestjs/event-emitter";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { MusicEvents } from "@rep/shared/events";
import { Server } from "socket.io";

@WebSocketGateway({
	cors: {
		origin: [process.env.PLAYLIST_URL],
	},
})
export class AppGateway {
	@WebSocketServer()
	private readonly server!: Server;

	@OnEvent(MusicEvents.QUEUE_UPDATE)
	handleMusicQueueUpdate(payload: { length: number }) {
		this.server.emit(MusicEvents.QUEUE_UPDATE, payload);
	}

	@OnEvent(MusicEvents.TRACK_ADD)
	handleMusicTrackAdd(payload: any) {
		this.server.emit(MusicEvents.TRACK_ADD, payload);
	}

	@OnEvent(MusicEvents.VIDEO_CHANGED)
	handleMusicVideoChanged(payload: any) {
		this.server.emit(MusicEvents.VIDEO_CHANGED, payload);
	}
}
