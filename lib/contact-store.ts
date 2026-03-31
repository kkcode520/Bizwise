import { RowDataPacket } from "mysql2";
import {
  deleteCardImageFromBlob,
  getStoredCardImageValue,
  resolveCardImageUrl,
  uploadCardImageToBlob,
} from "@/lib/blob-storage";
import { getDatabase } from "@/lib/database";
import { mockContacts, mockInsights } from "@/lib/mock-data";
import { Contact, ContactInsight, ScanResult } from "@/types";

type ContactRow = RowDataPacket & {
  id: string;
  user_id: string | null;
  name: string;
  company: string;
  title: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  note: string | null;
  card_image: string | null;
  created_at: Date | string;
  recognized_at: Date | string;
};

type InsightRow = RowDataPacket & {
  company_summary: string;
  company_news: string | string[] | null;
  industry_updates: string | string[] | null;
  icebreakers: string | string[] | null;
  follow_ups: string | string[] | null;
  source: "mock" | "ai";
  generated_at: Date | string;
};

type ContactCountRow = RowDataPacket & {
  total: number;
};

function toIsoString(input: Date | string) {
  return input instanceof Date ? input.toISOString() : new Date(input).toISOString();
}

function mapContact(row: ContactRow): Contact {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    name: row.name,
    company: row.company,
    title: row.title,
    phone: row.phone || undefined,
    email: row.email || undefined,
    address: row.address || undefined,
    website: row.website || undefined,
    note: row.note || undefined,
    cardImage: resolveCardImageUrl(row.card_image || undefined),
    createdAt: toIsoString(row.created_at),
    recognizedAt: toIsoString(row.recognized_at),
  };
}

function parseJsonArray(input: string | string[] | null | undefined) {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input;
  }

  try {
    const parsed = JSON.parse(input) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function mapInsight(row: InsightRow): ContactInsight {
  return {
    companySummary: row.company_summary,
    companyNews: parseJsonArray(row.company_news),
    industryUpdates: parseJsonArray(row.industry_updates),
    icebreakers: parseJsonArray(row.icebreakers),
    followUps: parseJsonArray(row.follow_ups),
    generatedAt: toIsoString(row.generated_at),
    source: row.source,
  };
}

export async function getContacts(userId?: string, search?: string) {
  const db = await getDatabase();

  if (!db) {
    return [...mockContacts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  const keyword = search?.trim();
  const pattern = keyword ? `%${keyword}%` : null;

  const [rows] = userId
    ? await db.execute<ContactRow[]>(
        `
      SELECT
            id, user_id, name, company, title, phone, email,
            NULL AS address, NULL AS website, NULL AS note, NULL AS card_image,
            created_at, recognized_at
          FROM contacts
          WHERE user_id = ?
            AND (? IS NULL OR name LIKE ? OR company LIKE ?)
          ORDER BY created_at DESC
        `,
        [userId, pattern, pattern, pattern]
      )
    : await db.query<ContactRow[]>(
        `
      SELECT
            id, user_id, name, company, title, phone, email,
            NULL AS address, NULL AS website, NULL AS note, NULL AS card_image,
            created_at, recognized_at
          FROM contacts
          ORDER BY created_at DESC
        `
      );

  return rows.map(mapContact);
}

export async function getContactById(id: string, userId?: string) {
  const db = await getDatabase();

  if (!db) {
    return mockContacts.find((item) => item.id === id);
  }

  const [rows] = userId
    ? await db.execute<ContactRow[]>(
        `
          SELECT
            id, user_id, name, company, title, phone, email, address, website, note, card_image,
            created_at, recognized_at
          FROM contacts
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `,
        [id, userId]
      )
    : await db.execute<ContactRow[]>(
        `
          SELECT
            id, user_id, name, company, title, phone, email, address, website, note, card_image,
            created_at, recognized_at
          FROM contacts
          WHERE id = ?
          LIMIT 1
        `,
        [id]
      );

  return rows[0] ? mapContact(rows[0]) : undefined;
}

export async function getInsightById(id: string) {
  const db = await getDatabase();

  if (!db) {
    return mockInsights[id];
  }

  const [rows] = await db.execute<InsightRow[]>(
    `
      SELECT
        company_summary, company_news, industry_updates, icebreakers, follow_ups, source, generated_at
      FROM contact_insights
      WHERE contact_id = ?
      LIMIT 1
    `,
    [id]
  );

  return rows[0] ? mapInsight(rows[0]) : undefined;
}

export async function saveInsight(id: string, insight: ContactInsight) {
  const db = await getDatabase();

  if (!db) {
    mockInsights[id] = insight;
    return insight;
  }

  const now = new Date();

  await db.execute(
    `
      INSERT INTO contact_insights (
        contact_id, company_summary, company_news, industry_updates, icebreakers, follow_ups, source, generated_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        company_summary = VALUES(company_summary),
        company_news = VALUES(company_news),
        industry_updates = VALUES(industry_updates),
        icebreakers = VALUES(icebreakers),
        follow_ups = VALUES(follow_ups),
        source = VALUES(source),
        generated_at = VALUES(generated_at),
        updated_at = VALUES(updated_at)
    `,
    [
      id,
      insight.companySummary,
      JSON.stringify(insight.companyNews),
      JSON.stringify(insight.industryUpdates),
      JSON.stringify(insight.icebreakers),
      JSON.stringify(insight.followUps),
      insight.source,
      new Date(insight.generatedAt),
      now,
    ]
  );

  return insight;
}

export async function createContact(
  input: ScanResult & { cardImage?: string },
  userId?: string
) {
  const db = await getDatabase();
  const now = new Date();
  const id = `c_${Date.now()}`;
  const cardImage =
    userId && input.cardImage
      ? await uploadCardImageToBlob({
          cardImage: input.cardImage,
          userId,
          contactId: id,
        })
      : input.cardImage;

  const contact: Contact = {
    id,
    userId,
    name: input.name,
    company: input.company,
    title: input.title,
    phone: input.phone,
    email: input.email,
    address: input.address,
    website: input.website,
    note: input.note,
    cardImage: resolveCardImageUrl(cardImage),
    createdAt: now.toISOString(),
    recognizedAt: now.toISOString(),
  };

  if (!db) {
    mockContacts.unshift(contact);
    return contact;
  }

  await db.execute(
    `
      INSERT INTO contacts (
        id, user_id, name, company, title, phone, email, address, website, note, card_image,
        created_at, recognized_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      contact.id,
      contact.userId || null,
      contact.name,
      contact.company,
      contact.title,
      contact.phone || null,
      contact.email || null,
      contact.address || null,
      contact.website || null,
      contact.note || null,
      cardImage || null,
      now,
      now,
      now,
    ]
  );

  return contact;
}

export async function getContactCountByUser(userId: string) {
  const db = await getDatabase();

  if (!db) {
    return mockContacts.length;
  }

  const [rows] = await db.execute<ContactCountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM contacts
      WHERE user_id = ?
    `,
    [userId]
  );

  return Number(rows[0]?.total || 0);
}

export async function updateContact(
  id: string,
  userId: string,
  input: ScanResult & { cardImage?: string }
) {
  const db = await getDatabase();

  if (!db) {
    const contact = mockContacts.find((item) => item.id === id);
    if (!contact) return null;
    Object.assign(contact, input);
    return contact;
  }

  const now = new Date();
  const currentContact = await getContactById(id, userId);

  if (!currentContact) {
    return null;
  }

  const hasNewCardImage = Boolean(input.cardImage?.startsWith("data:"));
  const nextCardImage = hasNewCardImage
    ? await uploadCardImageToBlob({
        cardImage: input.cardImage as string,
        userId,
        contactId: id,
      })
    : getStoredCardImageValue(input.cardImage) || getStoredCardImageValue(currentContact.cardImage);

  await db.execute(
    `
      UPDATE contacts
      SET
        name = ?,
        company = ?,
        title = ?,
        phone = ?,
        email = ?,
        address = ?,
        website = ?,
        note = ?,
        card_image = COALESCE(?, card_image),
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `,
    [
      input.name,
      input.company,
      input.title,
      input.phone || null,
      input.email || null,
      input.address || null,
      input.website || null,
      input.note || null,
      nextCardImage || null,
      now,
      id,
      userId,
    ]
  );

  if (hasNewCardImage) {
    await deleteCardImageFromBlob(currentContact.cardImage);
  }

  return getContactById(id, userId);
}

export async function deleteContact(id: string, userId: string) {
  const db = await getDatabase();

  if (!db) {
    const index = mockContacts.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockContacts.splice(index, 1);
    }
    delete mockInsights[id];
    return;
  }

  const contact = await getContactById(id, userId);

  await db.execute(
    `
      DELETE FROM contacts
      WHERE id = ? AND user_id = ?
    `,
    [id, userId]
  );

  await deleteCardImageFromBlob(contact?.cardImage);
}
