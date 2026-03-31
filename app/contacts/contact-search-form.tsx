"use client";

import { useState } from "react";

export function ContactSearchForm({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <form action="/contacts" method="GET" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
      <input
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="按姓名或公司搜索"
        style={{
          flex: "1 1 260px",
          border: "1px solid rgba(69, 50, 23, 0.12)",
          background: "rgba(255, 253, 248, 0.96)",
          borderRadius: 16,
          padding: "14px 16px",
          color: "var(--text)",
        }}
      />
      <button className="button" type="submit">
        搜索
      </button>
    </form>
  );
}
