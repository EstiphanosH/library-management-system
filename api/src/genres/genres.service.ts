import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGenreDto } from './dto/create-genre.dto.js';
import { UpdateGenreDto } from './dto/update-genre.dto.js';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  create(createGenreDto: CreateGenreDto) {
    return this.prisma.genre
      .create({ data: createGenreDto })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('A genre with this name already exists');
        }
        throw error;
      });
  }

  findAll() {
    return this.prisma.genre.findMany();
  }

  async findOne(id: string) {
    const genre = await this.prisma.genre.findUnique({ where: { id } });
    if (!genre) {
      throw new NotFoundException(`Genre ${id} not found`);
    }
    return genre;
  }

  async update(id: string, updateGenreDto: UpdateGenreDto) {
    await this.findOne(id);
    try {
      return await this.prisma.genre.update({
        where: { id },
        data: updateGenreDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A genre with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      return await this.prisma.genre.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete a genre while books still reference it',
        );
      }
      throw error;
    }
  }
}
