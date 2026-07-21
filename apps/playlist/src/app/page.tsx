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

export default function Page() {
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

	if (!isSocketReady())
		return (
			<b className="w-full h-full flex justify-center items-center">
				Chờ xíu...
			</b>
		);

	return (
		<div className="flex overflow-auto gap-4 h-full px-4 scrollbar-thumb-transparent scale-200 origin-left">
			{renderedQueue.map((item, index) => (
				<div
					data-state={index === 0 ? removePhase : QueueItemRemovePhase.idle}
					key={item.id}
					className={twMerge(
						"flex items-center animate-fade-up animate-fill-both duration-1000",
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
	);
}
