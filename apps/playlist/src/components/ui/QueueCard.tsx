"use client";

import { Bot, Crown, User } from "lucide-react";
import { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";
import { QueueItem } from "@/interfaces/queue";
import MarqueeText from "./MarqueeText";

interface CardProps {
	song: QueueItem;
	index: number;
	thumbnailUrl: string;
	className?: string;
	style?: CSSProperties;
}

export function SystemCard({
	song,
	index,
	thumbnailUrl,
	className,
	style,
}: CardProps) {
	return (
		<div
			className={twMerge(
				"relative flex items-center gap-2.5 w-48 min-w-48 p-2 rounded-lg overflow-hidden",
				"border backdrop-blur-sm z-0 relative",
				"system-bg system-border z-0",
				className,
			)}
			style={{
				...style,
			}}
		>
			<ThumbnailBackground thumbnailUrl={thumbnailUrl} />
			<ThumbnailImage
				thumbnailUrl={thumbnailUrl}
				title={song.title}
				index={index}
			/>

			<div className="flex flex-col w-48 z-10">
				<MarqueeText text={song.title} className="system-song-title" />
				<MarqueeText text={song.author} className="system-song-author" />
				<div className="flex items-center gap-1 mt-1.5">
					<div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full system-tag border border-zinc-700/50 scale-95 origin-left">
						<Bot size={10} className="opacity-70" strokeWidth={2.5} />
						<span className="font-bold tracking-tight">SYS</span>
					</div>
					<MarqueeText text="@system" className="system-name" />
				</div>
			</div>
		</div>
	);
}

// 2. COMPONENT VIP (SPECIAL VIEWER)
export function VipCard({
	song,
	index,
	thumbnailUrl,
	className,
	style,
}: CardProps) {
	return (
		<div
			className={twMerge(
				"relative flex items-center gap-2.5 w-48 min-w-48 p-2 rounded-lg overflow-hidden",
				"border backdrop-blur-sm z-0 relative",
				"special-viewer-bg ultra-vip-pulse z-0 transition-all duration-300",
				className,
			)}
			style={{
				...style,
			}}
		>
			<div className="absolute inset-0 -z-30 overflow-hidden rounded-lg pointer-events-none">
				<div
					className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2"
					style={{
						background:
							"conic-gradient(from 0deg, #00ffff, #007fff, #0000ff, #00ffff)",
						animation: "vipBorderRotate 3s linear infinite",
					}}
				/>
				<div className="absolute inset-[1.5px] bg-[#030d1a]/95 rounded-md" />
			</div>
			<div className="absolute inset-0 -z-20 pointer-events-none opacity-30 special-viewer-aurora mix-blend-lighten" />
			<div className="vip-sweep-line" style={{ animationDelay: "0s" }} />
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

			<ThumbnailBackground thumbnailUrl={thumbnailUrl} />
			<ThumbnailImage
				thumbnailUrl={thumbnailUrl}
				title={song.title}
				index={index}
			/>

			<div className="flex flex-col grow min-w-0 z-10 gap-0.5">
				<MarqueeText text={song.title} className="special-viewer-song-title" />
				<MarqueeText
					text={song.author}
					className="special-viewer-song-author"
				/>
				<div className="flex items-center gap-1.5 mt-1.5">
					<div
						className={twMerge(
							"flex items-center gap-1 px-1 py-px rounded-full scale-100",
							"special-viewer-tag",
						)}
					>
						<Crown
							size={10}
							className="text-yellow-200 drop-shadow-[0_0_2px_#fff]"
							strokeWidth={3}
						/>
						<span className="font-extrabold uppercase tracking-tight">VIP</span>
					</div>
					<span className="text-[11px] truncate font-black flex-1 special-viewer-name">
						{song.viewerName ? `@${song.viewerName}` : "@system"}
					</span>
					<MarqueeText
						text={`@${song.viewerName}`}
						className="special-viewer-name"
					/>
				</div>
			</div>
		</div>
	);
}

// 3. COMPONENT REQ (VIEWER)
export function ReqCard({
	song,
	index,
	thumbnailUrl,
	className,
	style,
}: CardProps) {
	return (
		<div
			className={twMerge(
				"relative flex items-center gap-2.5 w-48 min-w-48 p-2 rounded-lg overflow-hidden",
				"border backdrop-blur-sm z-0 relative",
				"viewer-bg viewer-border viewer-shadow z-0",
				className,
			)}
			style={{
				animationDelay: `${index * 60}ms`,
				animationFillMode: "both",
				...style,
			}}
		>
			<ThumbnailBackground thumbnailUrl={thumbnailUrl} />
			<ThumbnailImage
				thumbnailUrl={thumbnailUrl}
				title={song.title}
				index={index}
			/>

			<div className="flex flex-col grow min-w-0 z-10 gap-0.5">
				<MarqueeText text={song.title} className="viewer-song-title" />
				<MarqueeText text={song.author} className="viewer-song-author" />
				<div className="flex items-center gap-1.5 mt-1.5">
					<div
						className={twMerge(
							"flex items-center gap-1 px-1 py-px rounded-full scale-100",
							"viewer-tag",
						)}
					>
						<User size={10} strokeWidth={3} />
						<span className="font-bold tracking-tight">REQ</span>
					</div>
					<MarqueeText text={`@${song.viewerName}`} className="viewer-name" />
				</div>
			</div>
		</div>
	);
}

// --- CÁC SUB-COMPONENT BỔ TRỢ ĐỂ TRÁNH LẶP CODE (DRY) ---
function ThumbnailBackground({ thumbnailUrl }: { thumbnailUrl: string }) {
	return (
		<div
			className="absolute inset-0 -z-10 opacity-5 scale-110 blur-2xl pointer-events-none"
			style={{
				backgroundImage: `url(${thumbnailUrl})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		/>
	);
}

function ThumbnailImage({
	thumbnailUrl,
	title,
	index,
}: {
	thumbnailUrl: string;
	title: string;
	index: number;
}) {
	return (
		<div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 border border-white/20 z-10">
			<img
				src={thumbnailUrl}
				alt={title}
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
	);
}

// MAIN ROUTER CARD
export default function QueueCard({
	song,
	index,
	className,
	style,
}: {
	song: QueueItem;
	index: number;
	className?: string;
	style?: CSSProperties;
}) {
	const thumbnailUrl = `https://img.youtube.com/vi/${song?.videoId}/mqdefault.jpg`;
	const specialViewers =
		process.env.NEXT_PUBLIC_SPECIAL_VIEWER?.split(",") || [];
	const isSViewer = specialViewers.includes(song?.viewerName ?? "");

	if (isSViewer) {
		return (
			<VipCard
				song={song}
				index={index}
				thumbnailUrl={thumbnailUrl}
				className={className}
				style={style}
			/>
		);
	}

	if (song.tag === "viewer") {
		return (
			<ReqCard
				song={song}
				index={index}
				thumbnailUrl={thumbnailUrl}
				className={className}
				style={style}
			/>
		);
	}

	return (
		<SystemCard
			song={song}
			index={index}
			thumbnailUrl={thumbnailUrl}
			className={className}
			style={style}
		/>
	);
}
