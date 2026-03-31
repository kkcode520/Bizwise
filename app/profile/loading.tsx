import { SiteHeader } from "@/components/site-header";

export default function ProfileLoading() {
  return (
    <>
      <SiteHeader />
      <main className="shell section" style={{ display: "grid", gap: 20 }}>
        <section className="panel" style={{ padding: 24, display: "grid", gap: 14 }}>
          <p className="eyebrow">Account</p>
          <h1 style={{ margin: "8px 0 0", fontSize: 40 }}>个人中心</h1>
          <p className="subtitle">正在加载账户信息与联系人概况...</p>
        </section>

        <section className="grid two-col">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="panel"
              style={{ padding: 24, minHeight: 112, display: "grid", gap: 10, opacity: 0.72 }}
            >
              <div style={{ width: "28%", height: 14, borderRadius: 999, background: "rgba(15, 23, 42, 0.06)" }} />
              <div style={{ width: "54%", height: 20, borderRadius: 999, background: "rgba(15, 23, 42, 0.08)" }} />
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
