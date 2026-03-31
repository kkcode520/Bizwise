import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { generateInsightsWithOpenAI } from "@/lib/openai";
import { getContactById, getInsightById, saveInsight } from "@/lib/contact-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireSessionUser();
  const contact = await getContactById(id, user.id);

  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await generateInsightsWithOpenAI({
      name: contact.name,
      company: contact.company,
      title: contact.title,
      note: contact.note,
    });

    if (result) {
      await saveInsight(id, result);
      return NextResponse.json({ data: result });
    }
  } catch (error) {
    console.error("AI insight failed", error);
  }

  return NextResponse.json({ data: await getInsightById(id) });
}
