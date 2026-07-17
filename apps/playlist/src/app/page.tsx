"use client";

import { MusicEvents } from "@rep/shared/events";
import { useEffect, useState } from "react";
import { QueueType } from "@/interfaces/queue";
import { getQueue, getVideoPlaying } from "@/services";
import { useSocketStore } from "@/store/socket";

export default function Home() {
	const connectSocket = useSocketStore((state) => state.connect);
	const disconnectSocket = useSocketStore((state) => state.disconnect);
	const socket = useSocketStore((state) => state.socket);

	const [videoPlaying, setVideoPlaying] = useState<string | undefined>(
		undefined,
	);
	const [queue, setQueue] = useState<QueueType[]>([]);

	useEffect(() => {
		(async () => {
			const data = await getVideoPlaying();
			setVideoPlaying(data.videoId);
		})();
	}, []);

	useEffect(() => {
		connectSocket();
		return () => disconnectSocket();
	}, [connectSocket, disconnectSocket]);

	useEffect(() => {
		const fetchQueue = async () => {
			const data = await getQueue();
			setQueue(data);
			console.log(data);
		};

		fetchQueue();

		socket?.on(MusicEvents.QUEUE_UPDATE, () => {
			fetchQueue();
		});

		socket?.on(
			MusicEvents.VIDEO_CHANGED,
			(data: { song: { videoId: string } }) => {
				setVideoPlaying(data.song.videoId);
			},
		);

		socket?.on(MusicEvents.TRACK_ADD, (...args: any[]) => {
			console.log(args);
		});
	}, [socket]);

	return (
		<div className="bg-transparent flex gap-2 w-full overflow-auto py-10 scrollbar-track-transparent">
			{queue
				.slice(
					...(() => {
						const start = queue.findIndex((v) => v.videoId === videoPlaying);
						return [start + 1, start + 10];
					})(),
				)
				.map((song, index) => (
					<div
						key={song.videoId + crypto.randomUUID()}
						className={`flex w-content whitespace-nowrap rounded-md p-4 ${videoPlaying === song.videoId ? "bg-green-200" : "bg-neutral-200"} ${song.tag === "viewer" && "bg-red-200"}`}
					>
						<b>{index + 1}.</b> {song.title} - {song.author}{" "}
						{song.viewerName ? `| @${song.viewerName}` : ""}{" "}
					</div>
				))}
		</div>
	);
}
