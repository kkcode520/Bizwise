import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { deleteContact, getContactById, updateContact } from "@/lib/contact-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSessionUser();
  const { id } = await params;
  const body = await request.json();
  const contact = await updateContact(id, user.id, body);

  if (!contact) {
    return NextResponse.json({ error: "联系人不存在" }, { status: 404 });
  }

  return NextResponse.json({ contact });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSessionUser();
  const { id } = await params;
  const contact = await getContactById(id, user.id);

  if (!contact) {
    return NextResponse.json({ error: "联系人不存在" }, { status: 404 });
  }

  await deleteContact(id, user.id);
  return NextResponse.json({ ok: true });
}
