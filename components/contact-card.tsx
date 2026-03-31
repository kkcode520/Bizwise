import Link from "next/link";
import { ContactActions } from "@/components/contact-actions";
import { Contact } from "@/types";
import { formatDateTime } from "@/lib/utils";

export function ContactCard({ contact }: { contact: Contact }) {
  return (
    <article className="contact-card" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <Link href={`/contacts/${contact.id}`} style={{ fontSize: 20, fontWeight: 700 }}>
            {contact.name}
          </Link>
          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
            {contact.company} · {contact.title}
          </p>
        </div>
        <span className="pill">已识别</span>
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 8, color: "var(--muted)" }}>
        <span>录入时间：{formatDateTime(contact.createdAt)}</span>
        <span>{contact.phone || contact.email || "待补充联系方式"}</span>
      </div>

      <div style={{ marginTop: 18 }}>
        <ContactActions contactId={contact.id} compact />
      </div>
    </article>
  );
}
