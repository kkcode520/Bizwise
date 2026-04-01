import { ContactActions } from "@/components/contact-actions";
import { ContactEditForm } from "@/components/contact-edit-form";
import { InsightFetcher } from "@/components/insight-fetcher";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { requireSessionUser } from "@/lib/auth";
import { getContactById, getInsightById } from "@/lib/contact-store";
import { formatDateTime } from "@/lib/utils";

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const user = await requireSessionUser();
  const contact = await getContactById(id, user.id);

  if (!contact) {
    notFound();
  }

  const insight = await getInsightById(id);
  const editMode = resolvedSearchParams?.edit === "1";
  const cardImageSrc = contact.cardImage
    ? contact.cardImage.startsWith("data:")
      ? contact.cardImage
      : `/api/contacts/${id}/card-image`
    : "https://placehold.co/1200x760/f4efe6/6c6458?text=No+Card+Image";

  return (
    <>
      <SiteHeader />
      <main className="shell section" style={{ display: "grid", gap: 22 }}>
        <section className="grid two-col">
          <div className="panel" style={{ padding: 24, display: "grid", gap: 18 }}>
            <div>
              <p className="eyebrow">Contact Detail</p>
              <h1 style={{ margin: "8px 0 0", fontSize: 38 }}>{contact.name}</h1>
              <p className="subtitle" style={{ marginTop: 10 }}>
                {contact.company} · {contact.title}
              </p>
            </div>

            <div className="grid" style={{ gap: 12 }}>
              <div className="pill">创建时间：{formatDateTime(contact.createdAt)}</div>
              <div className="pill">识别时间：{formatDateTime(contact.recognizedAt)}</div>
            </div>

            <ContactActions contactId={id} />

            <div className="grid" style={{ gap: 14 }}>
              <Info label="手机号" value={contact.phone} />
              <Info label="邮箱" value={contact.email} />
              <Info label="地址" value={contact.address} />
              <Info label="官网" value={contact.website} />
              <Info label="备注" value={contact.note} />
            </div>
          </div>

          <section className="panel" style={{ padding: 18 }}>
            <img
              src={cardImageSrc}
              alt={`${contact.name} business card`}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 22, minHeight: 320 }}
            />
          </section>
        </section>

        {editMode ? <ContactEditForm contact={contact} /> : null}
        <InsightFetcher contactId={id} initialInsight={insight} />
      </main>
    </>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        background: "rgba(255,255,255,0.55)",
        borderRadius: 18,
        border: "1px solid var(--line)",
      }}
    >
      <strong style={{ display: "block", marginBottom: 6 }}>{label}</strong>
      <span style={{ color: "var(--muted)" }}>{value || "暂无"}</span>
    </div>
  );
}
