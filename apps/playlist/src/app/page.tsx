"use client";

import { MusicEvents } from "@rep/shared/events";
import { useEffect, useState } from "react";
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

	useEffect(() => {
		(async () => {
			const data = await getVideoPlaying();
			setVideoPlaying(data.videoId);

			const queue = await getQueue();

			setUpcomingQueue(
				queue.slice(
					...(() => {
						const start = queue.findIndex((v) => v.videoId === data.videoId);
						return [start + 1, start + 11];
					})(),
				),
			);
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
				fetchQueue();
			},
		);
	}, [socket]);

	useEffect(() => {
		if (!videoPlaying) return;

		// 1. Chạy fadeout card cũ trong 1s
		setAnimStage("fadeout");

		const afterFadeOutTimeout = setTimeout(() => {
			// 2. Hết 1s: Cập nhật luôn danh sách queue mới lên UI
			setUpcomingQueue(
				queue.slice(
					...(() => {
						const start = queue.findIndex((v) => v.videoId === videoPlaying);
						return [start + 1, start + 11];
					})(),
				),
			);

			// 3. Đồng thời ép div bọc ngoài của phần tử mới dịch sang phải 200px ngay lập tức (duration-0)
			setAnimStage("shift");

			// 4. Chờ một nhịp siêu ngắn để DOM nhận style dịch chuyển, rồi kích hoạt slide-in kéo về pl-0
			const slideInTimeout = setTimeout(() => {
				setAnimStage("slidein");

				// 5. Sau khi trượt xong 1s thì trả về trạng thái idle bình thường
				const idleTimeout = setTimeout(() => {
					setAnimStage("idle");
				}, 1000);

				return () => clearTimeout(idleTimeout);
			}, 50);

			return () => clearTimeout(slideInTimeout);
		}, 1000);

		return () => clearTimeout(afterFadeOutTimeout);
	}, [videoPlaying, queue]);

	return (
		<div className="bg-transparent flex items-center gap-3 w-full h-full overflow-x-auto py-4 px-4 scrollbar-none select-none z-0 relative">
			<style>{`
        @keyframes marquee { 0% { transform: translate3d(10%, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }
        .marquee-text { display: inline-block; white-space: nowrap; padding-left: 100%; animation: marquee 12s linear infinite; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

			{upcomingQueue.map((song, index) => {
				if (index === 0) {
					return (
						<div
							key={song.videoId + song.index}
							className={twMerge(
								"transition-[padding] ease-in-out",
								animStage === "shift" && "duration-0 pl-50",
								animStage === "slidein" && "duration-1000 pl-0",
							)}
						>
							<QueueCard
								song={song}
								index={index}
								className={twMerge(
									"animate-reverse",
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
						className=""
					/>
				);
			})}
		</div>
	);
}
