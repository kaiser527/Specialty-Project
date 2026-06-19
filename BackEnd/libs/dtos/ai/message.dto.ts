import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AiConversationPaginateDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  currentPage: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  limit: number;

  @IsNotEmpty()
  userId: string;
}

export class AiMessagePaginateDto {
  @IsInt()
  @Min(1)
  limit: number;

  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsOptional()
  @IsString()
  lastCreatedAt?: string;

  @IsOptional()
  @IsString()
  lastId?: string;
}
