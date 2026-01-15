import { getAllDocuments } from '@/backend/services/document.service';
import { prisma } from '@/lib/prisma';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findMany: jest.fn(),
    },
  },
}));

describe('Document Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDocuments', () => {
    it('should fetch and transform documents correctly', async () => {
      const mockDbDocuments = [
        {
          id: '1',
          title: 'Document One',
          userId: 'user123',
          category: 'work',
          status: 'active',
          createdAt: new Date('2026-01-10'),
          user: {
            email: 'test@example.com',
          },
        },
        {
          id: '2',
          title: 'Document Two',
          userId: 'user456',
          category: 'personal',
          status: 'archived',
          createdAt: new Date('2026-01-12'),
          user: {
            email: 'user2@example.com',
          },
        },
      ];

      (prisma.document.findMany as jest.Mock).mockResolvedValue(mockDbDocuments);

      const result = await getAllDocuments();

      expect(prisma.document.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          userId: true,
          category: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      expect(result).toEqual([
        {
          id: '1',
          title: 'Document One',
          userId: 'user123',
          category: 'work',
          status: 'active',
          createdAt: new Date('2026-01-10'),
          uploaderEmail: 'test@example.com',
        },
        {
          id: '2',
          title: 'Document Two',
          userId: 'user456',
          category: 'personal',
          status: 'archived',
          createdAt: new Date('2026-01-12'),
          uploaderEmail: 'user2@example.com',
        },
      ]);
    });

    it('should handle documents without user email', async () => {
      const mockDbDocuments = [
        {
          id: '1',
          title: 'Document Without User',
          userId: 'user123',
          category: 'test',
          status: 'active',
          createdAt: new Date('2026-01-10'),
          user: null,
        },
      ];

      (prisma.document.findMany as jest.Mock).mockResolvedValue(mockDbDocuments);

      const result = await getAllDocuments();

      expect(result[0].uploaderEmail).toBeNull();
    });

    it('should return empty array when no documents exist', async () => {
      (prisma.document.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getAllDocuments();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should order documents by createdAt desc', async () => {
      const mockDbDocuments = [
        {
          id: '3',
          title: 'Newest',
          userId: 'user1',
          category: 'test',
          status: 'active',
          createdAt: new Date('2026-01-14'),
          user: { email: 'newest@test.com' },
        },
        {
          id: '1',
          title: 'Oldest',
          userId: 'user1',
          category: 'test',
          status: 'active',
          createdAt: new Date('2026-01-10'),
          user: { email: 'oldest@test.com' },
        },
      ];

      (prisma.document.findMany as jest.Mock).mockResolvedValue(mockDbDocuments);

      const result = await getAllDocuments();

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
      
      // Result should maintain the order from database
      expect(result[0].title).toBe('Newest');
      expect(result[1].title).toBe('Oldest');
    });

    it('should handle database errors', async () => {
      (prisma.document.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(getAllDocuments()).rejects.toThrow('Database connection failed');
    });
  });
});
