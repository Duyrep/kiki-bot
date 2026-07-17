import { QueueType } from "@/interfaces";

export default async function getQueue() {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/music/queue`,
		{
			method: "GET",
		},
	);

	const data = (await response.json()) as QueueType[];

	return data;
}
