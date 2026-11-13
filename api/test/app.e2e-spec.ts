import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { vi } from 'vitest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

process.env.JWT_SECRET ??= 'e2e-test-secret-that-is-long-enough-for-hmac';

const genreId = 'a1b2c3d4-e5f6-4789-8abc-123456789012';
const bookId = 'b1b2c3d4-e5f6-4789-8abc-123456789012';
const patronId = 'c1b2c3d4-e5f6-4789-8abc-123456789012';
const librarianId = 'd1b2c3d4-e5f6-4789-8abc-123456789012';
const password = 'library-pass-123';
const passwordHash = bcrypt.hashSync(password, 4);

const genre = { id: genreId, name: 'Fantasy', description: null };
const book = {
  id: bookId,
  title: 'The Hobbit',
  author: 'J.R.R. Tolkien',
  isbn: '9780547928227',
  totalCopies: 5,
  availableCopies: 5,
  genreId,
};
const patron = {
  id: patronId,
  firstName: 'Pat',
  lastName: 'Reader',
  email: 'patron@example.com',
  password: passwordHash,
  role: 'PATRON',
};
const librarian = {
  id: librarianId,
  firstName: 'Lee',
  lastName: 'Librarian',
  email: 'librarian@example.com',
  password: passwordHash,
  role: 'LIBRARIAN',
};

const accounts: Array<typeof patron> = [];
const prismaMock = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  genre: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  book: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('Library API (e2e)', () => {
  let app: INestApplication<App> | undefined;

  beforeEach(async () => {
    accounts.length = 0;
    accounts.push(patron, librarian);

    prismaMock.user.create.mockImplementation(
      async ({ data }: { data: Omit<typeof patron, 'id' | 'role'> }) => {
        const created = {
          ...data,
          id: 'e1b2c3d4-e5f6-4789-8abc-123456789012',
          role: 'PATRON',
        };
        accounts.push(created);
        const { password: _password, ...publicUser } = created;
        return publicUser;
      },
    );
    prismaMock.user.findUnique.mockImplementation(
      async ({ where }: { where: { email: string } }) =>
        accounts.find((account) => account.email === where.email) ?? null,
    );
    prismaMock.genre.create.mockResolvedValue(genre);
    prismaMock.genre.findMany.mockResolvedValue([genre]);
    prismaMock.genre.findUnique.mockResolvedValue(genre);
    prismaMock.genre.update.mockResolvedValue({ ...genre, name: 'Updated' });
    prismaMock.genre.delete.mockResolvedValue(genre);
    prismaMock.book.create.mockResolvedValue(book);
    prismaMock.book.findMany.mockResolvedValue([book]);
    prismaMock.book.findUnique.mockResolvedValue(book);
    prismaMock.book.count.mockResolvedValue(1);
    prismaMock.book.update.mockResolvedValue({ ...book, title: 'Updated' });
    prismaMock.book.delete.mockResolvedValue(book);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    vi.clearAllMocks();
  });

  it('serves the API status message', async () => {
    await request(app!.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Library Management System API is running!');
  });

  it('provides full genre CRUD and validates create/update DTOs', async () => {
    await request(app!.getHttpServer()).get('/genres').expect(200, [genre]);
    await request(app!.getHttpServer())
      .post('/genres')
      .send({ name: 'Fantasy' })
      .expect(201, genre);
    await request(app!.getHttpServer())
      .get(`/genres/${genreId}`)
      .expect(200, genre);
    await request(app!.getHttpServer())
      .patch(`/genres/${genreId}`)
      .send({ name: 'Updated' })
      .expect(200, { ...genre, name: 'Updated' });
    await request(app!.getHttpServer())
      .delete(`/genres/${genreId}`)
      .expect(200, genre);
    await request(app!.getHttpServer())
      .post('/genres')
      .send({ name: 123 })
      .expect(400);
    await request(app!.getHttpServer())
      .patch(`/genres/${genreId}`)
      .send({ description: 123 })
      .expect(400);
    await request(app!.getHttpServer())
      .patch(`/genres/${genreId}`)
      .send({ name: null })
      .expect(400);
  });

  it('filters and paginates books using query parameters', async () => {
    await request(app!.getHttpServer())
      .get(`/books?genreId=${genreId}&search=tolkien&page=3&limit=5`)
      .expect(200, {
        data: [book],
        meta: { page: 3, limit: 5, total: 1, totalPages: 1 },
      });

    expect(prismaMock.book.findMany).toHaveBeenCalledWith({
      where: {
        genreId,
        OR: [
          { title: { contains: 'tolkien', mode: 'insensitive' } },
          { author: { contains: 'tolkien', mode: 'insensitive' } },
        ],
      },
      skip: 10,
      take: 5,
      orderBy: { title: 'asc' },
    });
    expect(prismaMock.book.count).toHaveBeenCalledWith({
      where: {
        genreId,
        OR: [
          { title: { contains: 'tolkien', mode: 'insensitive' } },
          { author: { contains: 'tolkien', mode: 'insensitive' } },
        ],
      },
    });
  });

  it('provides book CRUD, validates inputs, and restricts mutations to librarians', async () => {
    const server = app!.getHttpServer();
    const createBook = {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      isbn: '9780547928227',
      totalCopies: 5,
      genreId,
    };

    await request(server).get(`/books/${bookId}`).expect(200, book);
    await request(server).post('/books').send(createBook).expect(401);
    await request(server)
      .post('/books')
      .send({ ...createBook, genreId: 'not-a-uuid' })
      .expect(401);

    const patronLogin = await request(server)
      .post('/auth/login')
      .send({ email: patron.email, password })
      .expect(200);
    await request(server)
      .post('/books')
      .set('Authorization', `Bearer ${patronLogin.body.accessToken}`)
      .send(createBook)
      .expect(403);

    const librarianLogin = await request(server)
      .post('/auth/login')
      .send({ email: librarian.email, password })
      .expect(200);
    const auth = `Bearer ${librarianLogin.body.accessToken}`;
    await request(server)
      .post('/books')
      .set('Authorization', auth)
      .send(createBook)
      .expect(201, book);
    expect(prismaMock.book.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalCopies: 5,
          availableCopies: 5,
        }),
      }),
    );
    await request(server)
      .patch(`/books/${bookId}`)
      .set('Authorization', auth)
      .send({ title: 'Updated' })
      .expect(200, { ...book, title: 'Updated' });
    await request(server)
      .patch(`/books/${bookId}`)
      .set('Authorization', auth)
      .send({ totalCopies: 7 })
      .expect(200);
    expect(prismaMock.book.update).toHaveBeenLastCalledWith({
      where: { id: bookId },
      data: { totalCopies: 7, availableCopies: 7 },
    });
    prismaMock.book.findUnique.mockResolvedValueOnce({
      ...book,
      totalCopies: 5,
      availableCopies: 3,
    });
    await request(server)
      .patch(`/books/${bookId}`)
      .set('Authorization', auth)
      .send({ totalCopies: 1 })
      .expect(400);
    await request(server)
      .delete(`/books/${bookId}`)
      .set('Authorization', auth)
      .expect(200, book);
    for (const invalidField of [
      { title: 123 },
      { author: 123 },
      { isbn: 123 },
      { totalCopies: 'many' },
      { genreId: 'not-a-uuid' },
    ]) {
      await request(server)
        .post('/books')
        .set('Authorization', auth)
        .send({ ...createBook, ...invalidField })
        .expect(400);
      await request(server)
        .patch(`/books/${bookId}`)
        .set('Authorization', auth)
        .send(invalidField)
        .expect(400);
    }
  });

  it('registers patrons with a hashed password and serves authenticated profiles', async () => {
    const server = app!.getHttpServer();
    const registerPayload = {
      firstName: 'New',
      lastName: 'Reader',
      email: 'new@example.com',
      password,
      role: 'LIBRARIAN',
    };
    const registration = await request(server)
      .post('/auth/register')
      .send(registerPayload)
      .expect(201);

    expect(registration.body.user).toMatchObject({
      email: registerPayload.email,
      role: 'PATRON',
    });
    expect(registration.body.user).not.toHaveProperty('password');
    const createArgs = prismaMock.user.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
      select: Record<string, unknown>;
    };
    expect(createArgs.data.email).toBe(registerPayload.email);
    expect(createArgs.data).not.toHaveProperty('role');
    expect(createArgs.select).not.toHaveProperty('password');
    const storedPassword = accounts.find(
      (account) => account.email === registerPayload.email,
    )?.password;
    expect(storedPassword).not.toBe(password);
    expect(await bcrypt.compare(password, storedPassword!)).toBe(true);

    await request(server)
      .post('/auth/login')
      .send({ email: registerPayload.email, password })
      .expect(200);
    await request(server).get('/users/profile').expect(401);
    const login = await request(server)
      .post('/auth/login')
      .send({ email: registerPayload.email, password })
      .expect(200);
    const profile = await request(server)
      .get('/users/profile')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);
    expect(profile.body).toMatchObject({
      id: registration.body.user.id,
      email: registration.body.user.email,
      role: registration.body.user.role,
    });
  });

  it('limits login requests and rejects invalid credentials', async () => {
    const server = app!.getHttpServer();
    await request(server)
      .post('/auth/login')
      .send({ email: librarian.email, password: 'wrong-password' })
      .expect(401);
    for (let attempt = 0; attempt < 4; attempt++) {
      await request(server)
        .post('/auth/login')
        .send({ email: librarian.email, password: 'wrong-password' })
        .expect(401);
    }
    await request(server)
      .post('/auth/login')
      .send({ email: librarian.email, password: 'wrong-password' })
      .expect(429);
  });
});
