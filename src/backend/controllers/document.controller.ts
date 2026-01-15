import { NextRequest, NextResponse } from "next/server";
import { getAllDocuments } from "@/backend/services/document.service";
import { getSessionUser } from "@/backend/auth/session";

export async function getDocumentsController(req?: NextRequest) {
  try {
    // Om req finns -> läs query params (q, category, status)
    const url = req ? new URL(req.url) : null;
    const q = url?.searchParams.get("q");
    const category = url?.searchParams.get("category");
    const status = url?.searchParams.get("status");
    const mine = url?.searchParams.get("mine");

    const user = mine === "1" ? await getSessionUser() : null;

    const docs = await getAllDocuments({
      q,
      category,
      status,
      mine,
      userId: user?.id ?? null,
    });

    return NextResponse.json(docs);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
