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

function normalizeDuplicateKey(name: string, company: string) {
  return `${name.trim().toLowerCase()}::${company.trim().toLowerCase()}`;
}

export async function POST(request: Request) {
  const user = await requireSessionUser();
  const { contacts } = (await request.json()) as {
    contacts?: BatchContactInput[];
  };

  if (!Array.isArray(contacts) || !contacts.length) {
    return NextResponse.json({ error: "请至少提供一条联系人记录" }, { status: 400 });
  }

  const pendingContacts = contacts.filter((contact) => {
    if (contact.skip) {
      return false;
    }

    return Boolean(contact.name || contact.company || contact.title);
  });

  const batchDuplicateMap = new Map<
    string,
    { localId: string | null; name: string; company: string }[]
  >();

  for (const contact of pendingContacts) {
    if (contact.overwriteExistingId || contact.forceCreate) {
      continue;
    }

    const normalizedName = contact.name.trim();
    const normalizedCompany = contact.company.trim();

    if (!normalizedName || !normalizedCompany) {
      continue;
    }

    const key = normalizeDuplicateKey(normalizedName, normalizedCompany);
    const items = batchDuplicateMap.get(key) || [];
    items.push({
      localId: contact.localId || null,
      name: normalizedName,
      company: normalizedCompany,
    });
    batchDuplicateMap.set(key, items);
  }

  const repeatedBatchEntry = [...batchDuplicateMap.values()].find((items) => items.length > 1);

  if (repeatedBatchEntry) {
    return NextResponse.json(
      {
        error: "批量保存中发现批次内重复联系人，请先处理冲突。",
        duplicate: {
          name: repeatedBatchEntry[0].name,
          company: repeatedBatchEntry[0].company,
          localIds: repeatedBatchEntry.map((item) => item.localId),
        },
      },
      { status: 409 }
    );
  }

  for (const contact of pendingContacts) {
    if (contact.overwriteExistingId || contact.forceCreate) {
      continue;
    }

    const duplicate = await findDuplicateContact({
      userId: user.id,
      name: contact.name,
      company: contact.company,
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

  const saved = [];

  for (const contact of pendingContacts) {

    const { overwriteExistingId, forceCreate, localId: _localId, skip: _skip, ...input } = contact;

    if (overwriteExistingId) {
      const updated = await updateContact(overwriteExistingId, user.id, input);

      if (updated) {
        saved.push(updated);
      }
      continue;
    }

    saved.push(await createContact(input, user.id));
  }

  return NextResponse.json({
    count: saved.length,
    ids: saved.map((item) => item.id),
  });
}
