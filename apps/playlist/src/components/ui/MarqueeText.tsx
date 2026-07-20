import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

export default function MarqueeText({
	text,
	textClass,
	className,
}: {
	text: string;
	textClass?: string;
	className?: string;
}) {
	const [isOverflowing, setIsOverflowing] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLParagraphElement>(null);

	useEffect(() => {
		const checkOverflow = () => {
			if (containerRef.current && textRef.current) {
				const isOverflow =
					textRef.current.scrollWidth > containerRef.current.clientWidth;
				setIsOverflowing(isOverflow);
			}
		};

		checkOverflow();

		const resizeObserver = new ResizeObserver(checkOverflow);
		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => resizeObserver.disconnect();
	}, [text]);

	return (
		<div
			ref={containerRef}
			className={twMerge(
				"relative overflow-hidden w-full h-content",
				className,
			)}
		>
			<p
				ref={textRef}
				className={twMerge(
					"font-extrabold tracking-wide absolute left-0 whitespace-nowrap",
					isOverflowing ? "marquee-text" : "truncate w-full",
					textClass,
				)}
			>
				{text}
			</p>
			<div className="whitespace-nowrap text-transparent pointer-events-none select-none">
				{text}
			</div>
		</div>
	);
}
