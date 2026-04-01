import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { createContact, findDuplicateContact, updateContact } from "@/lib/contact-store";
import { ScanResult } from "@/types";

type BatchContactInput = ScanResult & {
  localId?: string;
  cardImage?: string;
  overwriteExistingId?: string;
  forceCreate?: boolean;
  skip?: boolean;
};

export async function POST(request: Request) {
  const user = await requireSessionUser();
  const { contacts } = (await request.json()) as {
    contacts?: BatchContactInput[];
  };

  if (!Array.isArray(contacts) || !contacts.length) {
    return NextResponse.json({ error: "请至少提供一条联系人记录" }, { status: 400 });
  }

  const saved = [];

  for (const contact of contacts) {
    if (contact.skip) {
      continue;
    }

    if (!(contact.name || contact.company || contact.title)) {
      continue;
    }

    const { overwriteExistingId, forceCreate, localId: _localId, skip: _skip, ...input } = contact;

    if (overwriteExistingId) {
      const updated = await updateContact(overwriteExistingId, user.id, input);

      if (updated) {
        saved.push(updated);
      }
      continue;
    }

    if (!forceCreate) {
      const duplicate = await findDuplicateContact({
        userId: user.id,
        name: input.name,
        company: input.company,
      });

      if (duplicate) {
        return NextResponse.json(
          {
            error: "批量保存中发现重复联系人，请先处理冲突。",
            duplicate: {
              id: duplicate.id,
              name: duplicate.name,
              company: duplicate.company,
              title: duplicate.title,
              localId: contact.localId || null,
            },
          },
          { status: 409 }
        );
      }
    }

    saved.push(await createContact(input, user.id));
  }

  return NextResponse.json({
    count: saved.length,
    ids: saved.map((item) => item.id),
  });
}
