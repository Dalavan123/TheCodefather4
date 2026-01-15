import { getDocumentsController } from '@/backend/controllers/document.controller';
import { getAllDocuments } from '@/backend/services/document.service';

// Mock the service
jest.mock('@/backend/services/document.service');

const mockGetAllDocuments = getAllDocuments as jest.MockedFunction<typeof getAllDocuments>;

type MockDocument = {
  id: string;
  title: string;
  userId: string;
  category: string | null;
  status: string;
  createdAt: Date;
  uploaderEmail: string | null;
};

describe('Document Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDocumentsController', () => {
    it('should return documents successfully', async () => {
      const mockDocuments: MockDocument[] = [
        {
          id: '1',
          title: 'Test Doc 1',
          userId: 'user1',
          category: 'general',
          status: 'active',
          createdAt: new Date('2026-01-10'),
          uploaderEmail: 'user1@test.com',
        },
        {
          id: '2',
          title: 'Test Doc 2',
          userId: 'user2',
          category: 'important',
          status: 'archived',
          createdAt: new Date('2026-01-12'),
          uploaderEmail: 'user2@test.com',
        },
      ];

      mockGetAllDocuments.mockResolvedValue(mockDocuments as never);

      const response = await getDocumentsController();
      const data = await response.json();

      expect(mockGetAllDocuments).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          title: 'Test Doc 1',
          userId: 'user1',
          category: 'general',
          status: 'active',
          uploaderEmail: 'user1@test.com',
        })
      ]));
    });

    it('should return empty array when no documents exist', async () => {
      mockGetAllDocuments.mockResolvedValue([] as never);

      const response = await getDocumentsController();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockGetAllDocuments.mockRejectedValue(new Error('Database error'));

      const response = await getDocumentsController();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch documents');
    });

    it('should handle null values gracefully', async () => {
      const mockDocuments: MockDocument[] = [
        {
          id: '1',
          title: 'Test Doc',
          userId: 'user1',
          category: null,
          status: 'active',
          createdAt: new Date('2026-01-10'),
          uploaderEmail: null,
        },
      ];

      mockGetAllDocuments.mockResolvedValue(mockDocuments as never);

      const response = await getDocumentsController();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].uploaderEmail).toBeNull();
      expect(data[0].category).toBeNull();
    });
  });
});
