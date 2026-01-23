// Mock dependencies
const mockPrisma = {
  user: { create: jest.fn(), findUnique: jest.fn() },
  session: { create: jest.fn(), delete: jest.fn() },
};


jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
  getPrisma: () => mockPrisma,
}));

jest.mock('bcryptjs');


import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';



describe('Auth API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        createdAt: '2026-01-14T05:06:08.151Z',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.user).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashedPassword123',
        },
        select: { id: true, email: true, createdAt: true },
      });
    });

    it('should return error for invalid email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: '',
          password: 'password123',
        }),
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email or password');
    });

    it('should return error for short password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: '12345',
        }),
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email or password');
    });

    it('should return error when email already exists', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      (prisma.user.create as jest.Mock).mockRejectedValue(new Error('Unique constraint'));

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'password123',
        }),
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashedPassword123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prisma.session.create as jest.Mock).mockResolvedValue({
        token: 'mockToken123',
        userId: '1',
        expiresAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
      });
      expect(prisma.session.create).toHaveBeenCalled();
    });

    it('should return error for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Fel email eller lösenord');
    });

    it('should return error for incorrect password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashedPassword123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Fel email eller lösenord');
    });

    it('should handle invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Fel email eller lösenord');
    });
  });
});
