export default async function getQueue() {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_YOUTUBE_MUSIC_API_SERVER}/song`,
		{
			method: "GET",
		},
	);

	const data = await response.json();

	return data;
}
