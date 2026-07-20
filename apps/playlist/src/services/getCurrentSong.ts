import { Song } from "@/interfaces";

export default async function getCurrentSong() {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_YOUTUBE_MUSIC_API_SERVER}/song`,
		{
			method: "GET",
		},
	);

	const data = (await response.json()) as Song;

	return data;
}
