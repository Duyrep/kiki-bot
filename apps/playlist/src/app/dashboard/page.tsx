"use client";

import { useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { QueueCard } from "@/components/ui";
import { useHydratedStore } from "@/hooks/useStore";
import { useQueueStore } from "@/stores";

export default function Dashboard() {
	const currentSong = useHydratedStore(useQueueStore, (s) => s.currentSong);
	const queue = useHydratedStore(useQueueStore, (s) => s.queue);

	const currentSongData =
		currentSong && queue ? queue.at(currentSong.index) : undefined;

	const fetchQueueState = useQueueStore((s) => s.fetchQueueState);
	const subscribeEvents = useQueueStore((s) => s.subscribeEvents);

	useEffect(() => {
		fetchQueueState();
		subscribeEvents();
	}, [fetchQueueState, subscribeEvents]);

	const specialViewers = (process.env.NEXT_PUBLIC_SPECIAL_VIEWER || "")
		.split(",")
		.filter(Boolean);

	return (
		<div className="w-full h-full bg-gray-950 p-4 flex flex-col gap-4 text-white overflow-x-auto">
			{/* ================= NOW PLAYING HERO SECTION ================= */}
			<div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
				<div className="lg:col-span-2 relative group overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-purple-950/20 to-gray-900/80 p-5 backdrop-blur-md shadow-2xl shadow-rose-950/20 transition-all duration-300 hover:border-rose-500/50 flex flex-col justify-between">
					{/* Ambient Glow Background Effect */}
					<div className="absolute -top-12 -left-12 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-500/30 transition-all" />

					{/* Header Status */}
					<div className="flex items-center justify-between mb-4 relative z-10">
						<div className="flex items-center gap-2">
							<span className="relative flex h-3 w-3">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
							</span>
							<span className="text-xs font-bold uppercase tracking-wider text-rose-300">
								Đang Phát Trực Tiếp
							</span>
						</div>

						{/* Equalizer Visualizer Icon */}
						<div className="flex items-end gap-1 h-4">
							<span className="w-1 bg-rose-400 rounded-full animate-[bounce_1s_infinite_100ms] h-full" />
							<span className="w-1 bg-rose-400 rounded-full animate-[bounce_1s_infinite_300ms] h-3" />
							<span className="w-1 bg-rose-400 rounded-full animate-[bounce_1s_infinite_200ms] h-full" />
							<span className="w-1 bg-rose-400 rounded-full animate-[bounce_1s_infinite_400ms] h-2" />
						</div>
					</div>

					{/* Card Content */}
					<div className="relative z-10 my-auto">
						{currentSongData ? (
							<QueueCard
								song={currentSongData}
								index={currentSong?.index ?? 0}
								className="w-full bg-transparent p-0 border-none shadow-none"
								width={"w-full"}
							/>
						) : (
							<div className="flex items-center justify-center py-8 text-gray-500 text-sm font-medium italic">
								Chưa có bài hát nào đang phát
							</div>
						)}
					</div>
				</div>

				<div className="flex flex-col justify-between bg-gray-900/60 rounded-2xl border border-gray-800/80 p-4 backdrop-blur-sm relative overflow-hidden h-44 overflow-y-auto">
					<div className="flex items-center justify-between border-b border-gray-800/80 pb-2.5 mb-3">
						<h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-cyan-400"></span>
							Cấu Hình Luồng
						</h3>
						<span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
							Active
						</span>
					</div>

					<div className="space-y-2 text-xs font-mono">
						{/* Special Viewers */}
						<div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800/50">
							<span className="text-gray-400 block mb-1">Special Viewers:</span>
							<div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
								{specialViewers.length > 0 ? (
									specialViewers.map((viewer, idx) => (
										<span
											key={viewer}
											className="bg-purple-950/80 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-md font-medium"
										>
											@{viewer}
										</span>
									))
								) : (
									<span className="text-gray-600 italic">Không có</span>
								)}
							</div>
						</div>

						{/* Upcoming Limit */}
						<div className="flex justify-between items-center bg-gray-950/60 p-2 rounded-lg border border-gray-800/50">
							<span className="text-gray-400">Upcoming Limit:</span>
							<span className="text-rose-400 font-bold">
								{process.env.NEXT_PUBLIC_UPCOMING_SONGS || "N/A"}
							</span>
						</div>

						{/* Backend URL */}
						<div className="flex justify-between items-center bg-gray-950/60 p-2 rounded-lg border border-gray-800/50 gap-2">
							<span className="text-gray-400 shrink-0">Backend:</span>
							<span
								className="text-blue-400 truncate text-[11px]"
								title={process.env.NEXT_PUBLIC_BACKEND_URL}
							>
								{process.env.NEXT_PUBLIC_BACKEND_URL || "N/A"}
							</span>
						</div>

						{/* WebSocket URL */}
						<div className="flex justify-between items-center bg-gray-950/60 p-2 rounded-lg border border-gray-800/50 gap-2">
							<span className="text-gray-400 shrink-0">WebSocket:</span>
							<span
								className="text-amber-400 truncate text-[11px]"
								title={process.env.NEXT_PUBLIC_WEBSOCKET_URL}
							>
								{process.env.NEXT_PUBLIC_WEBSOCKET_URL || "N/A"}
							</span>
						</div>

						{/* YouTube Music API Server */}
						<div className="flex justify-between items-center bg-gray-950/60 p-2 rounded-lg border border-gray-800/50 gap-2">
							<span className="text-gray-400 shrink-0">YT API:</span>
							<span
								className="text-emerald-400 truncate text-[11px]"
								title={process.env.NEXT_PUBLIC_YOUTUBE_MUSIC_API_SERVER}
							>
								{process.env.NEXT_PUBLIC_YOUTUBE_MUSIC_API_SERVER || "N/A"}
							</span>
						</div>
					</div>
				</div>
			</div>
			{/* ================= END NOW PLAYING SECTION ================= */}

			<div className="flex flex-1 min-h-0 gap-4">
				<Playlist />
				<UpcomingList />
				<OrderHistories />
			</div>
		</div>
	);
}

function Playlist() {
	const currentSong = useHydratedStore(useQueueStore, (s) => s.currentSong);
	const queue = useHydratedStore(useQueueStore, (s) => s.queue);
	const upComingQueue = useHydratedStore(useQueueStore, (s) => s.upComingQueue);

	const currentSongData =
		currentSong && queue ? queue.at(currentSong.index) : undefined;

	return (
		<div className="flex flex-col gap-2 w-full rounded-2xl bg-gray-900/40 border border-gray-800 p-4	">
			<div className="flex items-center justify-between pb-2 border-b border-gray-800">
				<h2 className="font-bold text-lg text-slate-200">Danh sách phát</h2>
				<span className="text-xs bg-gray-800 px-2.5 py-1 rounded-full text-gray-400 font-mono">
					{queue?.length ?? 0} bài
				</span>
			</div>
			<div className="h-full overflow-auto w-full flex flex-col gap-2">
				{queue && currentSong ? (
					queue.map((item, index) => {
						const isCurrent = currentSongData?.id === item.id;
						const isUpcoming = upComingQueue?.some((v) => v.id === item.id);
						return (
							<div
								key={`queue-${item.id}`}
								className={twMerge(
									"flex items-center gap-3 p-2.5 rounded-xl border animate-fade",
									isCurrent
										? "bg-rose-950/40 border-rose-500/40 text-rose-200 shadow-lg shadow-rose-950/20"
										: isUpcoming
											? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
											: "bg-gray-900/60 border-gray-800/60 ",
								)}
								style={{ animationDelay: `${index * 50}ms` }}
							>
								<span
									className={twMerge(
										"text-xs font-mono font-bold text-gray-400 w-8 text-center shrink-0",
										isCurrent
											? "border-rose-500/40 text-rose-200 shadow-lg shadow-rose-950/20"
											: isUpcoming
												? "border-emerald-500/30 text-emerald-200"
												: "border-gray-800/60 ",
									)}
								>
									#{item.id}
								</span>
								<QueueCard
									song={item}
									index={index}
									className="w-full bg-transparent p-0 border-none shadow-none"
									width={"w-full"}
								/>
							</div>
						);
					})
				) : (
					<div className="space-y-3">
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
					</div>
				)}
			</div>
		</div>
	);
}

function UpcomingList() {
	const upComingQueue = useHydratedStore(useQueueStore, (s) => s.upComingQueue);

	return (
		<div className="flex flex-col gap-2 w-full bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
			<div className="flex items-center justify-between pb-2 border-b border-gray-800">
				<h2 className="font-bold text-lg text-slate-200">Bài sắp tới</h2>
				<span className="text-xs bg-emerald-800 px-2.5 py-1 rounded-full text-emerald-200 font-mono border border-emerald-600">
					{upComingQueue?.length ?? 0} bài
				</span>
			</div>
			<div className="h-full overflow-auto w-full flex flex-col gap-2">
				{upComingQueue ? (
					upComingQueue.map((item, index) => (
						<div
							key={`upcoming-queue-${item.id}`}
							className={twMerge(
								"flex items-center gap-3 p-2.5 rounded-xl border border-emerald-800/60 bg-emerald-950/30 animate-fade",
							)}
							style={{ animationDelay: `${index * 50}ms` }}
						>
							<span className="text-xs font-mono font-bold text-emerald-200 w-8 text-center shrink-0">
								#{item.id}
							</span>
							<QueueCard
								song={item}
								index={item.index}
								className="w-full bg-transparent p-0 border-none shadow-none"
								width={"w-full"}
							/>
						</div>
					))
				) : (
					<div className="space-y-3">
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
					</div>
				)}
			</div>
		</div>
	);
}

function OrderHistories() {
	const currentSong = useHydratedStore(useQueueStore, (s) => s.currentSong);
	const orders = useHydratedStore(useQueueStore, (s) => s.orders);
	const upComingQueue = useHydratedStore(useQueueStore, (s) => s.upComingQueue);
	const queue = useHydratedStore(useQueueStore, (s) => s.queue);

	const currentSongData =
		currentSong && orders ? orders.at(currentSong.index) : undefined;

	return (
		<div className="flex flex-col gap-2 w-full rounded-2xl bg-gray-900/40 border border-gray-800 p-4	">
			<div className="flex items-center justify-between pb-2 border-b border-gray-800">
				<h2 className="font-bold text-lg text-slate-200">Lịch sử yêu cầu</h2>
				<span className="text-xs bg-gray-800 px-2.5 py-1 rounded-full text-gray-400 font-mono">
					{orders?.length ?? 0}
				</span>
			</div>
			<div className="h-full overflow-auto w-full flex flex-col gap-2">
				{orders && currentSong ? (
					orders.map((item, index) => {
						const song = queue?.find((v) => v.id === item.id);
						if (!song) return <div key={`order-${item.id}`}></div>;
						const isCurrent = currentSongData?.id === item.id;
						const isUpcoming = upComingQueue?.some((v) => v.id === item.id);
						return (
							<div
								key={`order-${item.id}`}
								className={twMerge(
									"flex flex-col justify-end gap-1 p-2.5 rounded-xl border animate-fade",
									isCurrent
										? "bg-rose-950/40 border-rose-500/40 text-rose-200 shadow-lg shadow-rose-950/20"
										: isUpcoming
											? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
											: "bg-gray-900/60 border-gray-800/60 ",
								)}
								style={{ animationDelay: `${index * 50}ms` }}
							>
								<div className="flex items-center gap-3">
									<span
										className={twMerge(
											"text-xs font-mono font-bold text-gray-400 w-8 text-center shrink-0",
											isCurrent
												? "border-rose-500/40 text-rose-200 shadow-lg shadow-rose-950/20"
												: isUpcoming
													? "border-emerald-500/30 text-emerald-200"
													: "border-gray-800/60 ",
										)}
									>
										#{song.id}
									</span>
									<QueueCard
										song={song}
										index={song.index}
										className="w-full bg-transparent p-0 border-none shadow-none"
										width={"w-full"}
									/>
								</div>
								<div className="text-[10px] text-gray-500 font-mono text-right pr-1">
									{new Date(item.createdAt).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}{" "}
									• {new Date(item.createdAt).toLocaleDateString()}
								</div>
							</div>
						);
					})
				) : (
					<div className="space-y-3">
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
					</div>
				)}
			</div>
		</div>
	);
}

function SkeletonCard({ className }: { className?: string }) {
	return (
		<div
			className={twMerge(
				"w-full h-20.25 bg-gray-800/50 rounded-xl animate-pulse border border-gray-800/80",
				className,
			)}
		/>
	);
}
