"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ContactActions({
  contactId,
  compact = false,
}: {
  contactId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Link className={compact ? "button ghost" : "button secondary"} href={`/contacts/${contactId}`}>
        查看
      </Link>
      <Link className={compact ? "button ghost" : "button ghost"} href={`/contacts/${contactId}?edit=1`}>
        编辑
      </Link>
      <button
        className={compact ? "button ghost" : "button ghost"}
        type="button"
        disabled={isPending}
        onClick={() => {
          const confirmed = window.confirm("确定删除这个联系人吗？该操作不可恢复。");

          if (!confirmed) {
            return;
          }

          startTransition(async () => {
            const response = await fetch(`/api/contacts/${contactId}`, {
              method: "DELETE",
            });

            if (response.ok) {
              router.push("/contacts");
            }
          });
        }}
      >
        {isPending ? "删除中..." : "删除"}
      </button>
    </div>
  );
}
