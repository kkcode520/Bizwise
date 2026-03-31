import { AuthForm } from "@/components/auth-form";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell section">
        <section className="auth-card" style={{ maxWidth: 560, margin: "0 auto", padding: 28 }}>
          <p className="eyebrow">Register</p>
          <h1 style={{ margin: "10px 0 0", fontSize: 36 }}>创建 BizWise 账号</h1>
          <p className="subtitle" style={{ marginTop: 12 }}>
            创建账号后，你的联系人、洞察信息与跟进记录都会按账户独立保存。
          </p>

          <AuthForm mode="register" />
        </section>
      </main>
    </>
  );
}
