import { PrismaClient } from '@prisma/client';
import { slugify } from '../src/genres/slugify.js';

const prisma = new PrismaClient();

const genres = [
  {
    name: 'Fantasy',
    description: 'Magic, mythical creatures, and imagined worlds.',
  },
  {
    name: 'Science Fiction',
    description: 'Speculative stories about science, technology, and the future.',
  },
  {
    name: 'Mystery',
    description: 'Stories centered on solving a crime, puzzle, or unexplained event.',
  },
  {
    name: 'Biography',
    description: 'Nonfiction accounts of the lives and experiences of real people.',
  },
];

const books = [
  {
    isbn: '9780547928227',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    publishedYear: 1937,
    genre: 'Fantasy',
  },
  {
    isbn: '9780618640157',
    title: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    publishedYear: 1954,
    genre: 'Fantasy',
  },
  {
    isbn: '9780439708180',
    title: 'Harry Potter and the Sorcerers Stone',
    author: 'J.K. Rowling',
    publishedYear: 1997,
    genre: 'Fantasy',
  },
  {
    isbn: '9780765326355',
    title: 'The Way of Kings',
    author: 'Brandon Sanderson',
    publishedYear: 2010,
    genre: 'Fantasy',
  },
  {
    isbn: '9780441172719',
    title: 'Dune',
    author: 'Frank Herbert',
    publishedYear: 1965,
    genre: 'Science Fiction',
  },
  {
    isbn: '9780451524935',
    title: '1984',
    author: 'George Orwell',
    publishedYear: 1949,
    genre: 'Science Fiction',
  },
  {
    isbn: '9780060850524',
    title: 'Brave New World',
    author: 'Aldous Huxley',
    publishedYear: 1932,
    genre: 'Science Fiction',
  },
  {
    isbn: '9780553293357',
    title: 'Foundation',
    author: 'Isaac Asimov',
    publishedYear: 1951,
    genre: 'Science Fiction',
  },
  {
    isbn: '9780394758282',
    title: 'The Big Sleep',
    author: 'Raymond Chandler',
    publishedYear: 1939,
    genre: 'Mystery',
  },
  {
    isbn: '9780062693662',
    title: 'Murder on the Orient Express',
    author: 'Agatha Christie',
    publishedYear: 1934,
    genre: 'Mystery',
  },
  {
    isbn: '9780451528018',
    title: 'The Hound of the Baskervilles',
    author: 'Arthur Conan Doyle',
    publishedYear: 1902,
    genre: 'Mystery',
  },
  {
    isbn: '9780062073488',
    title: 'And Then There Were None',
    author: 'Agatha Christie',
    publishedYear: 1939,
    genre: 'Mystery',
  },
  {
    isbn: '9780399590504',
    title: 'Educated',
    author: 'Tara Westover',
    publishedYear: 2018,
    genre: 'Biography',
  },
  {
    isbn: '9781524763138',
    title: 'Becoming',
    author: 'Michelle Obama',
    publishedYear: 2018,
    genre: 'Biography',
  },
  {
    isbn: '9780316548182',
    title: 'Long Walk to Freedom',
    author: 'Nelson Mandela',
    publishedYear: 1994,
    genre: 'Biography',
  },
  {
    isbn: '9780553296983',
    title: 'The Diary of a Young Girl',
    author: 'Anne Frank',
    publishedYear: 1947,
    genre: 'Biography',
  },
];

async function main(): Promise<void> {
  console.log('Starting library database seeding...');

  const genreIds = new Map<string, string>();
  for (const genre of genres) {
    const slug = slugify(genre.name);
    const savedGenre = await prisma.genre.upsert({
      where: { slug },
      update: { name: genre.name, description: genre.description },
      create: { ...genre, slug },
    });
    genreIds.set(savedGenre.name, savedGenre.id);
  }

  for (const book of books) {
    const genreId = genreIds.get(book.genre);
    if (!genreId) {
      throw new Error(`Seed genre not found: ${book.genre}`);
    }

    const description = `${book.title} by ${book.author}.`;
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {
        title: book.title,
        author: book.author,
        description,
        publishedYear: book.publishedYear,
        genreId,
      },
      create: {
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        description,
        publishedYear: book.publishedYear,
        totalCopies: 3,
        availableCopies: 3,
        genreId,
      },
    });
  }

  const [genreCount, bookCount] = await Promise.all([
    prisma.genre.count(),
    prisma.book.count(),
  ]);
  console.log(`Database seeding completed. Genres: ${genreCount}; books: ${bookCount}.`);
}

main()
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
