import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export enum InsertPosition {
	INSERT_AT_END = "INSERT_AT_END",
	INSERT_AFTER_CURRENT_VIDEO = "INSERT_AFTER_CURRENT_VIDEO",
}

export class AddSongToQueueDto {
	@IsString()
	@IsNotEmpty()
	videoId!: string;

	@IsEnum(InsertPosition)
	@IsNotEmpty()
	insertPosition!: InsertPosition;
}
