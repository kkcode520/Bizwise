"use client";

import { useEffect, useState } from "react";
import { ContactInsight } from "@/types";
import { InsightPanel } from "@/components/insight-panel";

export function InsightFetcher({
  contactId,
  initialInsight,
}: {
  contactId: string;
  initialInsight?: ContactInsight;
}) {
  const [insight, setInsight] = useState<ContactInsight | undefined>(initialInsight);
  const [loading, setLoading] = useState(!initialInsight);

  useEffect(() => {
    if (initialInsight) {
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      const response = await fetch(`/api/contacts/${contactId}/insights`);
      const result = (await response.json()) as { data?: ContactInsight };

      if (!cancelled) {
        setInsight(result.data);
        setLoading(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [contactId, initialInsight]);

  if (loading) {
    return (
      <section className="panel" style={{ padding: 24 }}>
        <p className="eyebrow">Business Brief</p>
        <h2 style={{ margin: "8px 0 0", fontSize: 28 }}>正在整理公司洞察与沟通建议</h2>
        <p className="subtitle" style={{ marginTop: 12 }}>
          系统正在综合联系人信息，生成公司摘要、相关新闻动态、行业观察与沟通建议。
        </p>
      </section>
    );
  }

  if (!insight) {
    return (
      <section className="panel" style={{ padding: 24 }}>
        <p className="eyebrow">Business Brief</p>
        <h2 style={{ margin: "8px 0 0", fontSize: 28 }}>暂时无法生成洞察</h2>
        <p className="subtitle" style={{ marginTop: 12 }}>
          当前还没有可展示的公司洞察信息，请稍后再试。
        </p>
      </section>
    );
  }

  return <InsightPanel insight={insight} />;
}
