import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { findDuplicateContact } from "@/lib/contact-store";

type DuplicateCheckInput = {
  localId: string;
  name: string;
  company: string;
};

export async function POST(request: Request) {
  const user = await requireSessionUser();
  const { contacts } = (await request.json()) as {
    contacts?: DuplicateCheckInput[];
  };

  if (!Array.isArray(contacts) || !contacts.length) {
    return NextResponse.json({ items: [] });
  }

  const items = [];

  for (const contact of contacts) {
    const duplicate = await findDuplicateContact({
      userId: user.id,
      name: contact.name,
      company: contact.company,
    });

    items.push({
      localId: contact.localId,
      duplicate: duplicate
        ? {
            id: duplicate.id,
            name: duplicate.name,
            company: duplicate.company,
            title: duplicate.title,
            createdAt: duplicate.createdAt,
          }
        : null,
    });
  }

  return NextResponse.json({ items });
}
