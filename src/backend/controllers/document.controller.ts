import { NextResponse } from "next/server";
import { getAllDocuments } from "@/backend/services/document.service";

export async function getDocumentsController() {
  try {
    const docs = await getAllDocuments();
    return NextResponse.json(docs);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}
