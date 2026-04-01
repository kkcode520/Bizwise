import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { getContactById } from "@/lib/contact-store";
import { getSignedBlobReadUrl } from "@/lib/blob-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSessionUser();
  const { id } = await params;
  const contact = await getContactById(id, user.id);

  if (!contact?.cardImage) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (contact.cardImage.startsWith("data:")) {
    return NextResponse.redirect(contact.cardImage);
  }

  const upstream = await fetch(getSignedBlobReadUrl(contact.cardImage), {
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new NextResponse("Not Found", { status: upstream.status });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}
