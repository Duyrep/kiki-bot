"use client";

import { MusicEvents } from "@rep/shared/events";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import QueueCard from "@/components/ui/QueueCard";
import { QueueType } from "@/interfaces/queue";
import { getQueue, getVideoPlaying } from "@/services";
import { useSocketStore } from "@/store/socket";

type AnimationStage = "idle" | "fadeout" | "shift" | "slidein";

export default function Home() {
	const connectSocket = useSocketStore((state) => state.connect);
	const disconnectSocket = useSocketStore((state) => state.disconnect);
	const socket = useSocketStore((state) => state.socket);

	const [videoPlaying, setVideoPlaying] = useState<string | undefined>(
		undefined,
	);
	const [queue, setQueue] = useState<QueueType[]>([]);
	const [upcomingQueue, setUpcomingQueue] = useState<QueueType[]>([]);
	const [animStage, setAnimStage] = useState<AnimationStage>("idle");

	const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);

	const isInitialChangeRef = useRef<boolean>(true);

	const latestQueueRef = useRef<QueueType[]>([]);
	latestQueueRef.current = queue;

	useEffect(() => {
		(async () => {
			const data = await getVideoPlaying();
			setVideoPlaying(data.videoId);

			const initialQueue = await getQueue();
			setQueue(initialQueue);

			setUpcomingQueue(
				initialQueue.slice(
					...(() => {
						const start = initialQueue.findIndex(
							(v) => v.videoId === data.videoId,
						);
						return [start + 1, start + 11];
					})(),
				),
			);

			setTimeout(() => {
				setIsFirstLoad(false);
			}, 1500);
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
			return data;
		};

		fetchQueue();

		socket?.on(MusicEvents.QUEUE_UPDATE, async () => {
			const data = await fetchQueue();
			setUpcomingQueue(
				data.slice(
					...(() => {
						const start = data.findIndex((v) => v.videoId === videoPlaying);
						return [start + 1, start + 11];
					})(),
				),
			);
		});
		socket?.on(
			MusicEvents.VIDEO_CHANGED,
			(data: { song: { videoId: string } }) => {
				setVideoPlaying(data.song.videoId);
				fetchQueue();
			},
		);
	}, [socket]);

	useEffect(() => {
		if (!videoPlaying) return;

		if (isInitialChangeRef.current) {
			isInitialChangeRef.current = false;
			return;
		}

		setAnimStage("fadeout");

		const afterFadeOutTimeout = setTimeout(() => {
			const currentQueue = latestQueueRef.current;

			setUpcomingQueue(
				currentQueue.slice(
					...(() => {
						const start = currentQueue.findIndex(
							(v) => v.videoId === videoPlaying,
						);
						return [start + 1, start + 11];
					})(),
				),
			);

			setAnimStage("shift");

			const slideInTimeout = setTimeout(() => {
				setAnimStage("slidein");

				const idleTimeout = setTimeout(() => {
					setAnimStage("idle");
				}, 1000);

				return () => clearTimeout(idleTimeout);
			}, 50);

			return () => clearTimeout(slideInTimeout);
		}, 1000);

		return () => clearTimeout(afterFadeOutTimeout);
	}, [videoPlaying]);

	return (
		<div className="bg-transparent flex items-center gap-3 w-full h-full overflow-x-auto py-4 px-4 scrollbar-none select-none z-0 relative">
			<style>{`
        @keyframes marquee { 0% { transform: translate3d(10%, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }
        .marquee-text { display: inline-block; white-space: nowrap; padding-left: 100%; animation: marquee 12s linear infinite; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

			{upcomingQueue.map((song, index) => {
				const animationDurationMs = 400 + index * 100;

				if (index === 0) {
					return (
						<div
							key={song.videoId + song.index}
							className={twMerge(
								"transition-[padding] ease-in-out",
								animStage === "shift" && "duration-0 pl-[200px]",
								animStage === "slidein" && "duration-1000 pl-0",
							)}
						>
							<QueueCard
								song={song}
								index={index}
								style={
									isFirstLoad
										? {
												animationDuration: `${animationDurationMs}ms`,
												animationTimingFunction: "ease-out",
											}
										: undefined
								}
								className={twMerge(
									isFirstLoad ? "" : "animate-reverse",
									isFirstLoad && "animate-fade-up",
									animStage === "fadeout" && "animate-fade duration-1000",
								)}
							/>
						</div>
					);
				}

				return (
					<QueueCard
						key={song.videoId + song.index}
						song={song}
						index={index}
						style={
							isFirstLoad
								? {
										animationDuration: `${animationDurationMs}ms`,
										animationTimingFunction: "ease-out",
									}
								: undefined
						}
						className={twMerge(isFirstLoad && "animate-fade-up")}
					/>
				);
			})}
		</div>
	);
}
