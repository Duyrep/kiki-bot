import { MusicEvents } from "@rep/shared/events";
import { persistNSync } from "persist-and-sync";
import { create } from "zustand";
import { Order, QueueItem, Song } from "@/interfaces";
import {
	getCurrentSong,
	getCurrentSongIndex,
	getOrders,
	getQueue,
} from "@/services";
import { useSocketStore } from "./socket";

export interface QueueState {
	websocket: WebSocket | undefined;
	currentSong: { song: Song; index: number } | undefined;
	queue: QueueItem[];
	upComingQueue: QueueItem[];
	orders: Order[];

	fetchQueue: () => Promise<void>;
	fetchCurrentSong: () => Promise<void>;
	fetchOrders: () => Promise<void>;
	fetchQueueState: () => Promise<void>;

	connectWS: () => void;
	subscribeEvents: () => void;
	disconnectWS: () => void;
}

export const useQueueStore = create<QueueState>()(
	persistNSync(
		(set, get) => ({
			websocket: undefined,
			currentSong: undefined,
			queue: [],
			upComingQueue: [],
			orders: [],

			fetchQueue: async () => {
				const upcomingSongs =
					Number(process.env.NEXT_PUBLIC_UPCOMING_SONGS) ?? 10;
				const queue = await getQueue();
				const start = (await getCurrentSongIndex()) + 1;
				set({
					queue,
					upComingQueue: queue.slice(start, start + upcomingSongs),
				});
			},

			fetchCurrentSong: async () => {
				const index = await getCurrentSongIndex();
				const song = await getCurrentSong();

				set({ currentSong: { song, index } });
			},

			fetchOrders: async () => {
				const orders = await getOrders();
				console.log(orders);
				set({ orders });
			},

			fetchQueueState: async () => {
				const { fetchCurrentSong, fetchQueue, fetchOrders } = get();

				await fetchCurrentSong();
				await fetchQueue();
				await fetchOrders();
			},

			connectWS: () => useSocketStore.getState().connect(),

			subscribeEvents: () => {
				const { socket } = useSocketStore.getState();
				const { fetchQueue, fetchCurrentSong, fetchOrders } = get();

				socket?.on(MusicEvents.QUEUE_UPDATE, fetchQueue);
				socket?.on(MusicEvents.VIDEO_CHANGED, fetchCurrentSong);
				socket?.on(MusicEvents.ORDER_ADDED, fetchOrders);
				socket?.on(MusicEvents.ORDER_REMOVED, fetchOrders);
			},

			disconnectWS: () => {
				const { socket, disconnect } = useSocketStore.getState();
				const { fetchQueue, fetchCurrentSong, fetchOrders } = get();

				socket?.off(MusicEvents.QUEUE_UPDATE, fetchQueue);
				socket?.off(MusicEvents.VIDEO_CHANGED, fetchCurrentSong);
				socket?.off(MusicEvents.ORDER_ADDED, fetchOrders);
				socket?.off(MusicEvents.ORDER_REMOVED, fetchOrders);

				disconnect();
			},
		}),
		{
			name: "queue-storage",
			exclude: ["websocket"],
		},
	),
);
