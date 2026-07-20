import { MusicEvents } from "@rep/shared/events";
import { create } from "zustand";
import { QueueItem } from "@/interfaces";
import { getCurrentSong, getCurrentSongIndex, getQueue } from "@/services";
import { useSocketStore } from "./socket";

export interface QueueState {
	websocket: WebSocket | undefined;
	currentSong: { videoId: string; index: number } | undefined;
	queue: QueueItem[];
	upComingQueue: QueueItem[];

	fetchQueue: () => Promise<void>;
	fetchCurrentSong: () => Promise<void>;
	fetchQueueState: () => Promise<void>;

	connectWS: () => void;
	subscribeEvents: () => void;
	disconnectWS: () => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
	websocket: undefined,
	currentSong: undefined,
	queue: [],
	upComingQueue: [],

	fetchQueue: async () => {
		const queue = await getQueue();
		const start = (await getCurrentSongIndex()) + 1;
		set({ queue, upComingQueue: queue.slice(start, start + 4) });
	},

	fetchCurrentSong: async () => {
		const index = await getCurrentSongIndex();
		const { videoId } = await getCurrentSong();

		set({ currentSong: { videoId, index } });
	},

	fetchQueueState: async () => {
		const { fetchCurrentSong, fetchQueue } = get();

		await fetchCurrentSong();
		await fetchQueue();
	},

	connectWS: () => useSocketStore.getState().connect(),

	subscribeEvents: () => {
		const { socket } = useSocketStore.getState();
		const { fetchQueue, fetchCurrentSong } = get();

		socket?.on(MusicEvents.QUEUE_UPDATE, fetchQueue);
		socket?.on(MusicEvents.VIDEO_CHANGED, fetchCurrentSong);
	},

	disconnectWS: () => {
		const { socket, disconnect } = useSocketStore.getState();
		const { fetchQueue, fetchCurrentSong } = get();

		socket?.off(MusicEvents.QUEUE_UPDATE, fetchQueue);
		socket?.off(MusicEvents.VIDEO_CHANGED, fetchCurrentSong);

		disconnect();
	},
}));
