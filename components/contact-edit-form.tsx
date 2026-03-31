"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Contact } from "@/types";

export function ContactEditForm({ contact }: { contact: Contact }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setError("");

      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          company: formData.get("company"),
          title: formData.get("title"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          address: formData.get("address"),
          website: formData.get("website"),
          note: formData.get("note"),
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error || "更新失败");
        return;
      }

      router.push(`/contacts/${contact.id}`);
    });
  };

  return (
    <section className="panel" style={{ padding: 24, display: "grid", gap: 16 }}>
      <div>
        <p className="eyebrow">Edit Contact</p>
        <h2 style={{ margin: "8px 0 0", fontSize: 28 }}>编辑联系人</h2>
      </div>
      <form onSubmit={handleSubmit} className="grid" style={{ gap: 14 }}>
        <Field label="姓名" name="name" defaultValue={contact.name} />
        <Field label="公司" name="company" defaultValue={contact.company} />
        <Field label="职位" name="title" defaultValue={contact.title} />
        <Field label="手机号" name="phone" defaultValue={contact.phone || ""} />
        <Field label="邮箱" name="email" defaultValue={contact.email || ""} />
        <Field label="地址" name="address" defaultValue={contact.address || ""} />
        <Field label="官网" name="website" defaultValue={contact.website || ""} />
        <div className="field">
          <label htmlFor="note">备注</label>
          <textarea id="note" name="note" defaultValue={contact.note || ""} />
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
            {isPending ? "保存中..." : "保存修改"}
          </button>
          <button
            className="button ghost"
            type="button"
            onClick={() => router.push(`/contacts/${contact.id}`)}
          >
            取消
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} defaultValue={defaultValue} />
    </div>
  );
}
