import { ContactSearchForm } from "@/app/contacts/contact-search-form";
import { ContactCard } from "@/components/contact-card";
import { SiteHeader } from "@/components/site-header";
import { requireSessionUser } from "@/lib/auth";
import { getContacts } from "@/lib/contact-store";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const user = await requireSessionUser();
  const params = await searchParams;
  const keyword = params?.q || "";
  const contacts = await getContacts(user.id, keyword);

  return (
    <>
      <SiteHeader />
      <main className="shell section" style={{ display: "grid", gap: 20 }}>
        <section className="panel" style={{ padding: 24 }}>
          <p className="eyebrow">Contacts</p>
          <h1 style={{ margin: "8px 0 0", fontSize: 40 }}>联系人库</h1>
          <p className="subtitle" style={{ marginTop: 12, maxWidth: 760 }}>
            你当前登录为 {user.name}，这里只展示你的联系人和 AI 洞察数据。
          </p>
          <ContactSearchForm initialValue={keyword} />
        </section>

        {contacts.length ? (
          <div className="grid">
            {contacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        ) : (
          <section className="panel" style={{ padding: 24 }}>
            <p className="subtitle">
              {keyword ? `没有找到与“${keyword}”相关的联系人。` : "你还没有联系人。"}
            </p>
          </section>
        )}
      </main>
    </>
  );
}
