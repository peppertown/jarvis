import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChatDto {
  @IsNotEmpty()
  @IsString()
  text: string;

  @IsNotEmpty()
  @IsNumber()
  sessionId: number;
}
