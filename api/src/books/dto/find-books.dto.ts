import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class FindBooksDto {
  @IsOptional()
  @IsUUID()
  genreId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @Transform(({ value }) => (value === undefined ? 1 : Number(value)))
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) => (value === undefined ? 10 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}
