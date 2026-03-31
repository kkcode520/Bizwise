"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ProfileSettings({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profilePending, startProfileTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startProfileTransition(async () => {
      setProfileError("");
      setProfileMessage("");
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setProfileError(result.error || "资料更新失败");
        return;
      }

      setProfileMessage("资料已更新");
      router.refresh();
    });
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startPasswordTransition(async () => {
      setPasswordError("");
      setPasswordMessage("");
      const response = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.get("currentPassword"),
          newPassword: formData.get("newPassword"),
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setPasswordError(result.error || "密码修改失败");
        return;
      }

      setPasswordMessage("密码已更新");
      (event.currentTarget as HTMLFormElement).reset();
    });
  };

  return (
    <div className="grid two-col">
      <section className="panel" style={{ padding: 24 }}>
        <p className="eyebrow">Account</p>
        <h2 style={{ margin: "8px 0 0", fontSize: 28 }}>修改资料</h2>
        <form onSubmit={handleProfileSubmit} className="grid" style={{ gap: 16, marginTop: 18 }}>
          <div className="field">
            <label htmlFor="profile-name">姓名</label>
            <input id="profile-name" name="name" defaultValue={name} required />
          </div>
          <div className="field">
            <label htmlFor="profile-email">邮箱</label>
            <input id="profile-email" name="email" type="email" defaultValue={email} required />
          </div>
          <button className="button" type="submit" disabled={profilePending}>
            {profilePending ? "保存中..." : "保存资料"}
          </button>
          {profileError ? <Message tone="error" text={profileError} /> : null}
          {profileMessage ? <Message tone="success" text={profileMessage} /> : null}
        </form>
      </section>

      <section className="panel" style={{ padding: 24 }}>
        <p className="eyebrow">Security</p>
        <h2 style={{ margin: "8px 0 0", fontSize: 28 }}>修改密码</h2>
        <form onSubmit={handlePasswordSubmit} className="grid" style={{ gap: 16, marginTop: 18 }}>
          <div className="field">
            <label htmlFor="current-password">当前密码</label>
            <input id="current-password" name="currentPassword" type="password" required />
          </div>
          <div className="field">
            <label htmlFor="new-password">新密码</label>
            <input id="new-password" name="newPassword" type="password" minLength={8} required />
          </div>
          <button className="button" type="submit" disabled={passwordPending}>
            {passwordPending ? "修改中..." : "更新密码"}
          </button>
          {passwordError ? <Message tone="error" text={passwordError} /> : null}
          {passwordMessage ? <Message tone="success" text={passwordMessage} /> : null}
        </form>
      </section>
    </div>
  );
}

function Message({ tone, text }: { tone: "error" | "success"; text: string }) {
  const styles =
    tone === "error"
      ? {
          color: "#9f1239",
          background: "rgba(244, 63, 94, 0.08)",
          border: "1px solid rgba(244, 63, 94, 0.18)",
        }
      : {
          color: "#166534",
          background: "rgba(34, 197, 94, 0.08)",
          border: "1px solid rgba(34, 197, 94, 0.18)",
        };

  return (
    <div style={{ ...styles, borderRadius: 16, padding: "12px 14px" }}>
      {text}
    </div>
  );
}
