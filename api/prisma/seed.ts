
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting library database seeding...');

  // STEP 1: CREATE GENRES

  const genres = [
    {
      name: 'Science Fiction',
      description: 'Futuristic technology, science and space.',
    },
    {
      name: 'Fantasy',
      description: 'Magic, mythical creatures and imaginary worlds.',
    },
    {
      name: 'Programming',
      description: 'Software development and computer programming.',
    },
    {
      name: 'History',
      description: 'Historical events, people and civilizations.',
    },
  ];

  const genreMap = new Map<string, string>();

  for (const genre of genres) {
    const savedGenre = await prisma.genre.upsert({
      where: { name: genre.name },
      update: { description: genre.description },
      create: genre,
    });

    genreMap.set(savedGenre.name, savedGenre.id);
  }

  console.log('Four genres created or verified.');

  // STEP 2: DEFINE BOOKS

  const books = [
    // SCIENCE FICTION
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
      isbn: '9780441172719',
      title: 'Dune',
      author: 'Frank Herbert',
      publishedYear: 1965,
      genre: 'Science Fiction',
    },

    // FANTASY
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

    // PROGRAMMING
    {
      isbn: '9780132350884',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      publishedYear: 2008,
      genre: 'Programming',
    },
    {
      isbn: '9780201616224',
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt and David Thomas',
      publishedYear: 1999,
      genre: 'Programming',
    },
    {
      isbn: '9780134757599',
      title: 'Refactoring',
      author: 'Martin Fowler',
      publishedYear: 2018,
      genre: 'Programming',
    },
    {
      isbn: '9781491950296',
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      publishedYear: 2017,
      genre: 'Programming',
    },

    // HISTORY
    {
      isbn: '9780062316097',
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      publishedYear: 2011,
      genre: 'History',
    },
    {
      isbn: '9780307474278',
      title: 'The Devil in the White City',
      author: 'Erik Larson',
      publishedYear: 2003,
      genre: 'History',
    },
    {
      isbn: '9780140449303',
      title: 'The Republic',
      author: 'Plato',
      publishedYear: -380,
      genre: 'History',
    },
    {
      isbn: '9780143127741',
      title: 'Guns, Germs, and Steel',
      author: 'Jared Diamond',
      publishedYear: 1997,
      genre: 'History',
    },
  ];

  // STEP 3: INSERT BOOKS

  for (const book of books) {
    const genreId = genreMap.get(book.genre);

    if (!genreId) {
      throw new Error(`Genre not found: ${book.genre}`);
    }

    await prisma.book.upsert({
      where: { isbn: book.isbn },

      update: {
        title: book.title,
        author: book.author,
        publishedYear: book.publishedYear,
        genreId,
      },

      create: {
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        publishedYear: book.publishedYear,
        totalCopies: 5,
        availableCopies: 5,
        genreId,
      },
    });
  }

  console.log('Sixteen books created or verified.');

  // STEP 4: VERIFY COUNTS

  const genreCount = await prisma.genre.count();
  const bookCount = await prisma.book.count();

  console.log('Database seeding completed.');
  console.log(`Total genres: ${genreCount}`);
  console.log(`Total books: ${bookCount}`);
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
