import { GET as getDocuments } from '@/app/api/documents/route';
import { getDocumentsController } from '@/backend/controllers/document.controller';
import { NextResponse } from 'next/server';

// Mock the controller
jest.mock('@/backend/controllers/document.controller');

describe('Documents API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/documents', () => {
    it('should return all documents successfully', async () => {
      const mockDocuments = [
        {
          id: '1',
          title: 'Test Document 1',
          content: 'Content 1',
          createdAt: '2026-01-01',
        },
        {
          id: '2',
          title: 'Test Document 2',
          content: 'Content 2',
          createdAt: '2026-01-02',
        },
      ];

      const mockResponse = NextResponse.json(mockDocuments);
      getDocumentsController.mockResolvedValue(mockResponse);

      const response = await getDocuments();
      const data = await response.json();

      expect(getDocumentsController).toHaveBeenCalled();
      expect(data).toEqual(mockDocuments);
    });

    it('should handle errors when fetching documents fails', async () => {
      const mockErrorResponse = NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
      getDocumentsController.mockResolvedValue(mockErrorResponse);

      const response = await getDocuments();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch documents');
    });

    it('should return empty array when no documents exist', async () => {
      const mockResponse = NextResponse.json([]);
      getDocumentsController.mockResolvedValue(mockResponse);

      const response = await getDocuments();
      const data = await response.json();

      expect(data).toEqual([]);
    });
  });
});
