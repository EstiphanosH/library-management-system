import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBookDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  author!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  isbn!: string;

  @IsInt()
  @Min(1)
  totalCopies!: number;

  @IsUUID()
  genreId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(-10000)
  @Max(3000)
  publishedYear?: number;
}
