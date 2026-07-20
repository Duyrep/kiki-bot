export default async function getCurrentSongIndex() {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/music/song/index`,
		{
			method: "GET",
		},
	);

	const data = (await response.json()) as number;
	return data;
}
