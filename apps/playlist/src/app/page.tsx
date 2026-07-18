"use client";

import { MusicEvents } from "@rep/shared/events";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
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

	// const upcomingQueue = queue.slice(
	// 	...(() => {
	// 		const start = queue.findIndex((v) => v.videoId === videoPlaying);
	// 		return [start + 1, start + 11];
	// 	})(),
	// );

	const upcomingQueue = queue;

	return (
		<div className="bg-transparent flex flex-wrap items-center gap-3 w-full h-full overflow-auto py-4 px-2 scrollbar-none select-none">
			{upcomingQueue.map((song, index) => {
				const thumbnailUrl = `https://img.youtube.com/vi/${song?.videoId}/mqdefault.jpg`;
				return (
					<div
						key={song.videoId + crypto.randomUUID()}
						className={twMerge(
							"relative flex items-center gap-2 w-[210px] min-w-[210px] p-2 rounded-md overflow-hidden",
							"border border-white/10 backdrop-blur-md shadow-lg transition-all duration-500 ease-out",
							"animate-in slide-in-from-right-5 fade-in duration-300",
							song.tag === "viewer"
								? "bg-black/50 border-purple-500/40 shadow-purple-500/5"
								: "bg-black/70 border-white/10",
						)}
					>
						{song.videoId !== videoPlaying ? (
							<div
								className="absolute inset-0 -z-10 opacity-20 scale-110 blur-lg pointer-events-none"
								style={{
									backgroundImage: `url(${thumbnailUrl})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
								}}
							/>
						) : (
							<div className="absolute inset-0 -z-10 opacity-90 scale-110 blur-lg pointer-events-none bg-red-500" />
						)}

						<div className="relative w-9 h-9 rounded-md overflow-hidden flex-shrink-0 border border-white/10">
							<img
								src={thumbnailUrl}
								alt={song.title}
								className="w-full h-full object-cover"
								onError={(e) => {
									(e.target as HTMLImageElement).src =
										"https://placehold.co/100x100/1e1e2e/ffffff?text=♫";
								}}
							/>
							<div className="absolute top-0 left-0 bg-black/85 text-white text-[8px] font-black px-1 rounded-br-sm">
								#{index + 1}
							</div>
						</div>

						{/* Metadata (Hỗ trợ cuộn chữ liên tục) */}
						<div className="flex flex-col flex-grow min-w-0">
							{/* Container chứa text cuộn */}
							<div className="relative overflow-hidden w-full h-4.5">
								<p
									className={twMerge(
										"text-xs font-semibold text-white tracking-wide absolute left-0",
										song.title.length > 20 ? "marquee-text" : "truncate w-full",
									)}
								>
									{song.title}
								</p>
							</div>

							<p className="text-[10px] text-white/50 truncate font-medium -mt-0.5">
								{song.author}
							</p>

							<div className="flex items-center gap-1 mt-0.5">
								{song.tag === "viewer" ? (
									<span className="text-[8px] font-bold px-1 py-0.2 rounded bg-gradient-to-r from-pink-500 to-purple-600 text-white uppercase tracking-wider scale-90 origin-left">
										Req
									</span>
								) : (
									<span className="text-[8px] font-bold text-white/30 uppercase tracking-wider scale-90 origin-left">
										Sys
									</span>
								)}
								<span className="text-[9px] text-white/40 truncate max-w-[80px] font-medium">
									{song.viewerName ? `@${song.viewerName}` : "@system"}
								</span>
							</div>
						</div>

						{song.tag === "viewer" && (
							<div className="absolute inset-0 border border-purple-500/35 rounded-xl pointer-events-none animate-pulse" />
						)}
					</div>
				);
			})}
		</div>
	);
}
