import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { createContact } from "@/lib/contact-store";

export async function POST(request: Request) {
  const user = await requireSessionUser();
  const body = await request.json();
  const contact = await createContact(body, user.id);

  return NextResponse.json({
    id: contact.id,
  });
}
