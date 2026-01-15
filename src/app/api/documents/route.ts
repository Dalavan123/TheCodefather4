import { NextRequest } from "next/server";
import { getDocumentsController } from "@/backend/controllers/document.controller";

export async function GET(req: NextRequest) {
  return getDocumentsController(req);
}
