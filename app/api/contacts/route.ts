import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { createContact, findDuplicateContact, updateContact } from "@/lib/contact-store";

export async function POST(request: Request) {
  const user = await requireSessionUser();
  const body = await request.json();
  const { overwriteExistingId, forceCreate, ...contactInput } = body as {
    overwriteExistingId?: string;
    forceCreate?: boolean;
    name: string;
    company: string;
    title: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    note?: string;
    cardImage?: string;
  };

  if (overwriteExistingId) {
    const updated = await updateContact(overwriteExistingId, user.id, contactInput);

    if (!updated) {
      return NextResponse.json({ error: "原联系人不存在" }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      mode: "overwrite",
    });
  }

  if (!forceCreate) {
    const duplicate = await findDuplicateContact({
      userId: user.id,
      name: contactInput.name,
      company: contactInput.company,
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error: "检测到重复联系人",
          duplicate: {
            id: duplicate.id,
            name: duplicate.name,
            company: duplicate.company,
            title: duplicate.title,
            createdAt: duplicate.createdAt,
          },
        },
        { status: 409 }
      );
    }
  }

  const contact = await createContact(contactInput, user.id);

  return NextResponse.json({
    id: contact.id,
    mode: "create",
  });
}
