import { getDocumentsController } from "@/backend/controllers/document.controller";

export async function GET() {
  return getDocumentsController();
}
