import { ProfileSettings } from "@/components/profile-settings";
import { SiteHeader } from "@/components/site-header";
import { requireSessionUser, getUserById } from "@/lib/auth";
import { getContactCountByUser, getContacts } from "@/lib/contact-store";
import { formatDateTime } from "@/lib/utils";

export default async function ProfilePage() {
  const sessionUser = await requireSessionUser();
  const [user, contactCount, recentContacts] = await Promise.all([
    getUserById(sessionUser.id),
    getContactCountByUser(sessionUser.id),
    getContacts(sessionUser.id),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="shell section" style={{ display: "grid", gap: 20 }}>
        <section className="panel" style={{ padding: 24, display: "grid", gap: 16 }}>
          <div>
            <p className="eyebrow">Account</p>
            <h1 style={{ margin: "8px 0 0", fontSize: 40 }}>个人中心</h1>
          </div>
          <p className="subtitle" style={{ maxWidth: 760 }}>
            在这里管理你的账户信息，并查看当前联系人资产概况。
          </p>
          <div className="grid two-col">
            <InfoCard label="姓名" value={user?.name || sessionUser.name} />
            <InfoCard label="邮箱" value={user?.email || sessionUser.email} />
            <InfoCard label="联系人总数" value={`${contactCount}`} />
            <InfoCard
              label="最近联系人时间"
              value={
                recentContacts[0]
                  ? formatDateTime(recentContacts[0].createdAt)
                  : "暂无联系人"
              }
            />
          </div>
        </section>

        <section className="panel" style={{ padding: 24, display: "grid", gap: 14 }}>
          <div>
            <p className="eyebrow">Recent Contacts</p>
            <h2 style={{ margin: "8px 0 0", fontSize: 30 }}>最近录入</h2>
          </div>
          {recentContacts.length ? (
            recentContacts.slice(0, 5).map((contact) => (
              <div
                key={contact.id}
                style={{
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.55)",
                  borderRadius: 18,
                  border: "1px solid var(--line)",
                }}
              >
                <strong style={{ display: "block" }}>
                  {contact.name} · {contact.company}
                </strong>
                <span style={{ color: "var(--muted)" }}>
                  {contact.title} · {formatDateTime(contact.createdAt)}
                </span>
              </div>
            ))
          ) : (
            <p className="subtitle">你还没有录入联系人，可以从拍照页开始。</p>
          )}
        </section>

        <ProfileSettings
          name={user?.name || sessionUser.name}
          email={user?.email || sessionUser.email}
        />
      </main>
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "16px 18px",
        background: "rgba(255,255,255,0.55)",
        borderRadius: 18,
        border: "1px solid var(--line)",
      }}
    >
      <strong style={{ display: "block", marginBottom: 8 }}>{label}</strong>
      <span style={{ color: "var(--muted)" }}>{value}</span>
    </div>
  );
}
