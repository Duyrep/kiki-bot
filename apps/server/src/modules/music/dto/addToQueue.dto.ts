import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum InsertPosition {
	AFTER_CURRENT = "INSERT_AFTER_CURRENT_VIDEO",
	AFTER_END_OF_VIEWERS_VIDEO = "INSERT_AFTER_END_OF_VIEWERS_VIDEO",
	AT_END = "INSERT_AT_END",
}

export class AddToQueueDto {
	@IsString()
	@IsNotEmpty()
	videoId!: string;

	@IsString()
	@IsNotEmpty()
	viewerName!: string;

	@IsEnum(InsertPosition)
	@IsOptional()
	insertPosition!: InsertPosition;

	@IsString()
	@IsNotEmpty()
	tag!: string;
}
