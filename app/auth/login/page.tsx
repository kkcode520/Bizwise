import { AuthForm } from "@/components/auth-form";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell section">
        <section className="auth-card" style={{ maxWidth: 520, margin: "0 auto", padding: 28 }}>
          <p className="eyebrow">Login</p>
          <h1 style={{ margin: "10px 0 0", fontSize: 36 }}>登录 BizWise</h1>
          <p className="subtitle" style={{ marginTop: 12 }}>
            登录后即可管理你的联系人信息、公司洞察与后续沟通建议。
          </p>

          <AuthForm mode="login" />

          <p style={{ marginTop: 20, color: "var(--muted)" }}>
            还没有账号？<Link href="/auth/register" style={{ color: "var(--brand-strong)", fontWeight: 700 }}>立即注册</Link>
          </p>
        </section>
      </main>
    </>
  );
}
