"use client";

import { MusicEvents } from "@rep/shared/events";
import { Bot, Crown, User } from "lucide-react";
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

		socket?.on(MusicEvents.QUEUE_UPDATE, () => fetchQueue());
		socket?.on(
			MusicEvents.VIDEO_CHANGED,
			(data: { song: { videoId: string } }) =>
				setVideoPlaying(data.song.videoId),
		);
	}, [socket]);

	const upcomingQueue = queue.slice(
		...(() => {
			const start = queue.findIndex((v) => v.videoId === videoPlaying);
			return [start + 1, start + 11];
		})(),
	);

	return (
		<div className="bg-transparent flex items-center gap-3 w-full h-full overflow-x-auto py-4 px-4 scrollbar-none select-none z-0 relative">
			<style>{`
        @keyframes marquee { 0% { transform: translate3d(10%, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }
        .marquee-text { display: inline-block; white-space: nowrap; padding-left: 100%; animation: marquee 12s linear infinite; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

			{upcomingQueue.map((song, index) => {
				const thumbnailUrl = `https://img.youtube.com/vi/${song?.videoId}/mqdefault.jpg`;
				const specialViewers =
					process.env.NEXT_PUBLIC_SPECIAL_VIEWER?.split(",") || [];
				const isSViewer = specialViewers.includes(song.viewerName);

				/* --- CẤU HÌNH UI THEO ROLE --- */
				let cardClasses = "system-bg system-border z-0";
				let titleClass = "system-song-title";
				let authorClass = "system-song-author";
				let tagClass = "system-tag";
				let nameClass = "system-name";
				let tagElement = (
					<div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full system-tag border border-zinc-700/50 scale-95 origin-left">
						<Bot size={10} className="opacity-70" strokeWidth={2.5} />
						<span className="font-bold tracking-tight">SYS</span>
					</div>
				);

				if (isSViewer) {
					cardClasses =
						"special-viewer-bg ultra-vip-pulse z-0 transition-all duration-300";
					titleClass = "special-viewer-song-title";
					authorClass = "special-viewer-song-author";
					tagClass = "special-viewer-tag";
					nameClass = "special-viewer-name";
					tagElement = (
						<div
							className={twMerge(
								"flex items-center gap-1 px-1 py-0.25 rounded-full scale-100",
								tagClass,
							)}
						>
							<Crown
								size={10}
								className="text-yellow-200 drop-shadow-[0_0_2px_#fff]"
								strokeWidth={3}
							/>
							<span className="font-extrabold uppercase tracking-tight">
								VIP
							</span>
						</div>
					);
				} else if (song.tag === "viewer") {
					cardClasses = "viewer-bg viewer-border viewer-shadow z-0";
					titleClass = "viewer-song-title";
					authorClass = "viewer-song-author";
					tagClass = "viewer-tag";
					nameClass = "viewer-name";
					tagElement = (
						<div
							className={twMerge(
								"flex items-center gap-1 px-1 py-0.25 rounded-full scale-100",
								tagClass,
							)}
						>
							<User size={10} strokeWidth={3} />
							<span className="font-bold tracking-tight">REQ</span>
						</div>
					);
				}

				return (
					<div
						key={song.videoId}
						className={twMerge(
							"relative flex items-center gap-2.5 w-48 min-w-48 p-2 rounded-lg overflow-hidden",
							"border backdrop-blur-sm z-0 relative",
							cardClasses,
						)}
						style={{
							animationDelay: `${index * 60}ms`,
							animationFillMode: "both",
						}}
					>
						{
							/* --- HIỆU ỨNG NỀN VIP --- */
							isSViewer && (
								<>
									<div className="absolute inset-0 -z-30 overflow-hidden rounded-lg pointer-events-none">
										<div
											className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2"
											style={{
												background:
													"conic-gradient(from 0deg, #00ffff, #007fff, #0000ff, #00ffff)",
												animation: "vipBorderRotate 3s linear infinite",
											}}
										/>
										<div className="absolute inset-[1.5px] bg-[#030d1a]/95 rounded-[6px]" />
									</div>

									<div className="absolute inset-0 -z-20 pointer-events-none opacity-30 special-viewer-aurora mix-blend-lighten" />

									<div
										className="vip-sweep-line"
										style={{ animationDelay: "0s" }}
									/>
									<div
										className="vip-sweep-line"
										style={{ animationDelay: "2s", width: "25px" }}
									/>

									<div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-80">
										<div
											className="vip-particle w-1.5 h-1.5 left-[15%]"
											style={{ animationDuration: "3s", background: "#00ffff" }}
										/>
										<div
											className="vip-particle w-1 h-1 left-[55%]"
											style={{
												animationDuration: "4s",
												background: "#007fff",
												animationDelay: "1s",
											}}
										/>
										<div
											className="vip-particle w-2.5 h-2.5 left-[85%]"
											style={{
												animationDuration: "2.5s",
												background: "#00ff66",
												animationDelay: "0.5s",
											}}
										/>
									</div>

									<div
										className="vip-sparkle top-1.5 right-1.5"
										style={{ animationDuration: "1.5s" }}
									/>
									<div
										className="vip-sparkle bottom-1.5 left-16"
										style={{ animationDuration: "2s", animationDelay: "0.5s" }}
									/>
								</>
							)
						}

						{/* Thumbnail Blur Background */}
						<div
							className="absolute inset-0 -z-10 opacity-5 scale-110 blur-2xl pointer-events-none"
							style={{
								backgroundImage: `url(${thumbnailUrl})`,
								backgroundSize: "cover",
								backgroundPosition: "center",
							}}
						/>

						{/* Thumbnail */}
						<div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 border border-white/20 z-10">
							<img
								src={thumbnailUrl}
								alt={song.title}
								className="w-full h-full object-cover"
								onError={(e) => {
									(e.target as HTMLImageElement).src =
										"https://placehold.co/100x100/1e1e2e/ffffff?text=♫";
								}}
							/>
							<div className="absolute top-0 left-0 bg-black/85 text-white text-[9px] font-black px-1.5 rounded-br-sm shadow-md border-r border-b border-white/10">
								#{index + 1}
							</div>
						</div>

						{/* Song Info */}
						<div className="flex flex-col grow min-w-0 z-10 gap-0.5">
							<div className="relative overflow-hidden w-full h-5">
								<p
									className={twMerge(
										"text-[13px] font-extrabold tracking-wide absolute left-0",
										song.title.length > 20 ? "marquee-text" : "truncate w-full",
										titleClass,
									)}
								>
									{song.title}
								</p>
							</div>
							<p
								className={twMerge(
									"text-[11px] truncate font-semibold -mt-0.5 opacity-90",
									authorClass,
								)}
							>
								{song.author}
							</p>

							{/* Tag & User Name */}
							<div className="flex items-center gap-1.5 mt-1.5">
								{tagElement}
								<span
									className={twMerge(
										"text-[11px] truncate font-black flex-1",
										nameClass,
									)}
								>
									{song.viewerName ? `@${song.viewerName}` : "@system"}
								</span>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
