import { SiteHeader } from "@/components/site-header";

export default function ContactsLoading() {
  return (
    <>
      <SiteHeader />
      <main className="shell section" style={{ display: "grid", gap: 20 }}>
        <section className="panel" style={{ padding: 24, display: "grid", gap: 14 }}>
          <p className="eyebrow">Contacts</p>
          <h1 style={{ margin: "8px 0 0", fontSize: 40 }}>联系人库</h1>
          <p className="subtitle">正在加载你的联系人和洞察概览...</p>
        </section>

        <div className="grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <section
              key={index}
              className="contact-card"
              style={{ padding: 20, minHeight: 164, opacity: 0.72 }}
            >
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ width: "42%", height: 22, borderRadius: 999, background: "rgba(15, 23, 42, 0.08)" }} />
                <div style={{ width: "58%", height: 14, borderRadius: 999, background: "rgba(15, 23, 42, 0.06)" }} />
                <div style={{ width: "36%", height: 14, borderRadius: 999, background: "rgba(15, 23, 42, 0.06)" }} />
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
