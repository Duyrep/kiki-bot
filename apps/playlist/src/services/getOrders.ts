import { Order } from "@/interfaces";

export default async function getOrders() {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/music/orders`,
		{
			method: "GET",
		},
	);

	const data = (await response.json()) as Order[];

	return data;
}
