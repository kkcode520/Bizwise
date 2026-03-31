"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setError("");

      const response = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password"),
          }),
        }
      );

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error || "请求失败");
        return;
      }

      router.push(mode === "login" ? "/contacts" : "/capture");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid" style={{ gap: 16, marginTop: 20 }}>
      {mode === "register" ? (
        <div className="field">
          <label htmlFor="name">姓名</label>
          <input id="name" name="name" placeholder="请输入你的姓名" required />
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="email">邮箱</label>
        <input id="email" name="email" type="email" placeholder="请输入邮箱" required />
      </div>

      <div className="field">
        <label htmlFor="password">密码</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          placeholder="至少 8 位"
          required
        />
      </div>

      {error ? (
        <div
          style={{
            color: "#9f1239",
            background: "rgba(244, 63, 94, 0.08)",
            border: "1px solid rgba(244, 63, 94, 0.18)",
            borderRadius: 16,
            padding: "12px 14px",
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className="button" type="submit" disabled={isPending}>
          {isPending ? "提交中..." : mode === "login" ? "登录" : "注册"}
        </button>
        {mode === "login" ? (
          <Link className="button secondary" href="/auth/register">
            去注册
          </Link>
        ) : (
          <Link className="button secondary" href="/auth/login">
            去登录
          </Link>
        )}
      </div>
    </form>
  );
}
