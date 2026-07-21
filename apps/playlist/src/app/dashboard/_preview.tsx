"use client";

import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { QueueCard } from "@/components/ui";
import { QueueItem } from "@/interfaces";
import { useQueueStore, useSocketStore } from "@/stores";

enum QueueItemRemovePhase {
	idle = "idle",
	fadingOut = "fading-out",
	snappingPadding = "snapping-padding",
	collapsing = "collapsing",
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function QueueOverlayPreview() {
	const currentSong = useQueueStore((state) => state.currentSong);
	const queue = useQueueStore((state) => state.upComingQueue);
	const socket = useSocketStore((state) => state.socket);
	const isSocketReady = useSocketStore((state) => state.isSocketReady);

	const fetchQueueState = useQueueStore((state) => state.fetchQueueState);
	const fetchQueue = useQueueStore((state) => state.fetchQueue);
	const connectWS = useQueueStore((state) => state.connectWS);
	const subscribeEvents = useQueueStore((state) => state.subscribeEvents);
	const disconnectWS = useQueueStore((state) => state.disconnectWS);

	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [renderedQueue, setRenderedQueue] = useState<QueueItem[]>([]);
	const [removePhase, setRemovePhase] = useState<QueueItemRemovePhase>(
		QueueItemRemovePhase.idle,
	);

	useEffect(() => {
		(async () => {
			await fetchQueueState();
			setIsFirstLoad(false);
		})();
		connectWS();
		return () => disconnectWS();
	}, []);

	useEffect(() => {
		setRenderedQueue(queue);
	}, [queue]);

	useEffect(() => {
		if (socket) subscribeEvents();
	}, [socket]);

	useEffect(() => {
		if (isFirstLoad) return;
		(async () => {
			setRemovePhase(QueueItemRemovePhase.fadingOut);
			await delay(1000);
			await fetchQueue();
			setRemovePhase(QueueItemRemovePhase.snappingPadding);
			await delay(10);
			setRemovePhase(QueueItemRemovePhase.collapsing);
		})();
	}, [currentSong]);

	return (
		<div className="relative flex flex-col w-full bg-gray-900/80 rounded-2xl border border-gray-800 backdrop-blur-md overflow-hidden shadow-2xl">
			{/* Header Preview Bar */}
			<div className="flex items-center justify-between px-4 py-3 bg-gray-950/70 border-b border-gray-800">
				<div className="flex items-center gap-2">
					<div className="flex gap-1.5">
						<span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
						<span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
						<span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
					</div>
					<span className="text-xs font-mono font-semibold text-gray-400 ml-2">
						OBS Overlay Preview (1:1 Scale View)
					</span>
				</div>

				<div className="flex items-center gap-3">
					<span
						className={twMerge(
							"text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1.5",
							isSocketReady()
								? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
								: "bg-amber-500/10 text-amber-400 border-amber-500/30",
						)}
					>
						<span
							className={twMerge(
								"w-1.5 h-1.5 rounded-full",
								isSocketReady()
									? "bg-emerald-400 animate-pulse"
									: "bg-amber-400",
							)}
						/>
						{isSocketReady() ? "WS Connected" : "Connecting..."}
					</span>

					<span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md font-mono border border-gray-700">
						{renderedQueue?.length ?? 0} items
					</span>
				</div>
			</div>

			<div className="relative w-full h-36 bg-[radial-gradient(#1f2937_1px,transparent_1px)] bg-size-[16px_16px] bg-gray-950/90 overflow-hidden flex items-center p-4">
				{!isSocketReady() ? (
					<div className="w-full h-full flex items-center justify-center text-gray-400 font-mono text-sm">
						<span className="animate-pulse">
							Đang kết nối WebSocket Overlay...
						</span>
					</div>
				) : renderedQueue?.length === 0 ? (
					<div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-sm italic">
						Hàng chờ trống
					</div>
				) : (
					<div className="flex overflow-x-auto gap-4 h-44 w-full items-center scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
						{renderedQueue.map((item, index) => (
							<div
								data-state={
									index === 0 ? removePhase : QueueItemRemovePhase.idle
								}
								key={item.id}
								className={twMerge(
									"flex items-center shrink-0 animate-fade-up animate-fill-both duration-1000",
									"data-[state=fading-out]:animate-fade data-[state=fading-out]:animate-reverse data-[state=fading-out]:duration-1000",
									"data-[state=snapping-padding]:pl-52 data-[state=snapping-padding]:duration-0",
									"data-[state=collapsing]:pl-0 data-[state=collapsing]:duration-1000",
								)}
								style={{
									animationDelay: `${index * 100}ms`,
									animationFillMode: "both",
								}}
							>
								<QueueCard song={item} index={index} />
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
