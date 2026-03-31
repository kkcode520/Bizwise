import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { getSessionUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="shell" style={{ paddingTop: 20 }}>
      <div className="panel site-header-panel">
        <Link href="/" className="site-header-brand">
          <div className="site-header-logo" />
          <div>
            <strong style={{ display: "block", fontSize: 18 }}>BizWise</strong>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>
              拍下名片，读懂对方，顺利开聊
            </span>
          </div>
        </Link>

        <nav className="site-header-nav">
          <Link className="button ghost" href="/contacts">
            联系人
          </Link>
          {user ? (
            <>
              <Link className="button ghost" href="/profile">
                个人中心
              </Link>
              <span className="pill">{user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <Link className="button secondary" href="/auth/login">
              登录
            </Link>
          )}
          <Link className="button" href="/capture">
            立即拍照
          </Link>
        </nav>
      </div>
    </header>
  );
}
