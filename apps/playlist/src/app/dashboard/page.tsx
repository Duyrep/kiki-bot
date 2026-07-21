"use client";

import { useEffect, useState } from "react";
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

	return (
		<div className="w-full h-full bg-gray-950 p-4 flex flex-col gap-4 text-white overflow-x-auto">
			<div className="w-full flex justify-center">
				{currentSongData ? (
					<QueueCard
						song={currentSongData}
						index={currentSong?.index ?? 0}
						className="w-96"
						width={"w-full"}
					/>
				) : (
					<SkeletonCard className="w-96" />
				)}
			</div>
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
						{[...Array(4)].map(() => (
							<SkeletonCard key={crypto.randomUUID()} />
						))}
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
								index={index}
								className="w-full bg-transparent p-0 border-none shadow-none"
								width={"w-full"}
							/>
						</div>
					))
				) : (
					<div className="space-y-3">
						{[...Array(4)].map(() => (
							<SkeletonCard key={crypto.randomUUID()} />
						))}
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
						{[...Array(4)].map(() => (
							<SkeletonCard key={crypto.randomUUID()} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function SkeletonCard({ className }: { className?: string }) {
	const [delay, setDelay] = useState<string>("0ms");

	useEffect(() => {
		setDelay(`${Math.random() * 2}s`);
	}, []);

	return (
		<div
			className={twMerge(
				"w-full h-20.25 bg-gray-800/50 rounded-xl animate-pulse border border-gray-800/80",
				className,
			)}
			style={{ animationDelay: delay }}
		/>
	);
}
