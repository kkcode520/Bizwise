import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ContactCard } from "@/components/contact-card";
import { getSessionUser } from "@/lib/auth";
import { mockContacts } from "@/lib/mock-data";

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <>
      <SiteHeader />
      <main className="shell section" style={{ display: "grid", gap: 22 }}>
        <section className="hero-card" style={{ padding: 28 }}>
          <div className="grid two-col" style={{ alignItems: "center" }}>
            <div style={{ display: "grid", gap: 18 }}>
              <span className="pill">移动端优先 · AI 名片助手</span>
              <div>
                <p className="eyebrow">BizWise</p>
                <h1 className="title">拍下名片，然后知道怎么开口。</h1>
              </div>
              <p className="subtitle" style={{ maxWidth: 620 }}>
                BizWise 帮你在手机上快速完成商务名片采集、联系人存档、公司背景补充和聊天破冰建议生成。
                不只是存信息，而是帮你准备下一次真正的商务沟通。
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link className="button" href="/capture">
                  {user ? "开始录入名片" : "立即开始使用"}
                </Link>
                <Link className="button secondary" href="/contacts">
                  {user ? "查看我的联系人" : "浏览联系人管理"}
                </Link>
              </div>
            </div>

            <div className="grid three-col">
              <div className="stat-card" style={{ padding: 20 }}>
                <p className="eyebrow">1</p>
                <h3 style={{ margin: "8px 0" }}>拍照识别</h3>
                <p className="subtitle">直接调用手机相机，提取姓名、公司、职位和联系方式。</p>
              </div>
              <div className="stat-card" style={{ padding: 20 }}>
                <p className="eyebrow">2</p>
                <h3 style={{ margin: "8px 0" }}>公司洞察</h3>
                <p className="subtitle">自动补充公司摘要、相关新闻动态与值得关注的业务信息。</p>
              </div>
              <div className="stat-card" style={{ padding: 20 }}>
                <p className="eyebrow">3</p>
                <h3 style={{ margin: "8px 0" }}>破冰建议</h3>
                <p className="subtitle">把泛泛的“保持联系”变成更自然、更有信息量的交流。</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid two-col">
          <div className="panel" style={{ padding: 24, display: "grid", gap: 14 }}>
            <div>
              <p className="eyebrow">How It Works</p>
              <h2 style={{ margin: "8px 0 0", fontSize: 32 }}>从名片到有效沟通的一条路径</h2>
            </div>
            <p className="subtitle">打开 BizWise 后，你可以在几步之内完成名片录入、联系人归档以及公司洞察生成，方便后续跟进与沟通。</p>
            <div className="grid" style={{ gap: 12 }}>
              {[
                "通过链接打开网站，完成注册或登录",
                "拍摄/上传商务名片，自动提取结构化字段",
                "确认并保存联系人记录，自动记录日期",
                "查看 AI 行业动态、聊天破冰话题和跟进建议",
              ].map((item, index) => (
                <div key={item} className="pill" style={{ justifyContent: "flex-start" }}>
                  {index + 1}. {item}
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ padding: 24, display: "grid", gap: 18 }}>
            <div>
              <p className="eyebrow">Key Pages</p>
              <h2 style={{ margin: "8px 0 0", fontSize: 32 }}>核心使用入口</h2>
            </div>
            <div className="grid" style={{ gap: 12 }}>
              <Link className="button ghost" href="/auth/register">
                注册页
              </Link>
              <Link className="button ghost" href="/auth/login">
                登录页
              </Link>
              <Link className="button ghost" href="/capture">
                名片拍摄页
              </Link>
              <Link className="button ghost" href="/contacts">
                联系人列表页
              </Link>
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end" }}>
            <div>
              <p className="eyebrow">Recent Contacts</p>
              <h2 style={{ margin: "8px 0 0", fontSize: 32 }}>近期联系人示例</h2>
            </div>
            <Link href="/contacts" style={{ color: "var(--brand-strong)", fontWeight: 700 }}>
              查看全部
            </Link>
          </div>
          {user ? (
            <div className="pill">已登录为 {user.name}，你的联系人与洞察信息将按账户独立管理。</div>
          ) : null}
          <div className="grid">
            {mockContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
