import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { FindBooksDto } from './dto/find-books.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ genreId, search, page, limit }: FindBooksDto) {
    const where: Prisma.BookWhereInput = {};
    if (genreId) {
      where.genreId = genreId;
    }
    if (search?.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { author: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: 'asc' },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Book ${id} not found`);
    }
    return book;
  }

  create(createBookDto: CreateBookDto) {
    return this.prisma.book
      .create({
        data: {
          title: createBookDto.title,
          author: createBookDto.author,
          isbn: createBookDto.isbn,
          totalCopies: createBookDto.totalCopies,
          genreId: createBookDto.genreId,
          description: createBookDto.description,
          publishedYear: createBookDto.publishedYear,
          availableCopies: createBookDto.totalCopies,
        },
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('A book with this ISBN already exists');
        }
        throw error;
      });
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    const book = await this.findOne(id);
    const data: Prisma.BookUpdateInput = {};
    if (updateBookDto.title !== undefined) data.title = updateBookDto.title;
    if (updateBookDto.author !== undefined) data.author = updateBookDto.author;
    if (updateBookDto.isbn !== undefined) data.isbn = updateBookDto.isbn;
    if (updateBookDto.genreId !== undefined) {
      data.genre = { connect: { id: updateBookDto.genreId } };
    }
    if (updateBookDto.description !== undefined) {
      data.description = updateBookDto.description;
    }
    if (updateBookDto.publishedYear !== undefined) {
      data.publishedYear = updateBookDto.publishedYear;
    }

    if (updateBookDto.totalCopies !== undefined) {
      const borrowedCopies = book.totalCopies - book.availableCopies;
      if (updateBookDto.totalCopies < borrowedCopies) {
        throw new BadRequestException(
          `totalCopies cannot be less than the ${borrowedCopies} copies currently borrowed`,
        );
      }
      data.totalCopies = updateBookDto.totalCopies;
      data.availableCopies = updateBookDto.totalCopies - borrowedCopies;
    }

    try {
      return await this.prisma.book.update({ where: { id }, data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A book with this ISBN already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.book.delete({ where: { id } });
  }
}
