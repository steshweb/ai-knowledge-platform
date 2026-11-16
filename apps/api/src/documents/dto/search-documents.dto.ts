import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchDocumentsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  query!: string;
}
