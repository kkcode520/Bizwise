import { ContactInsight } from "@/types";
import { formatDateTime } from "@/lib/utils";

export function InsightPanel({ insight }: { insight: ContactInsight }) {
  const companyNews = Array.isArray(insight.companyNews) ? insight.companyNews : [];
  const industryUpdates = Array.isArray(insight.industryUpdates) ? insight.industryUpdates : [];
  const icebreakers = Array.isArray(insight.icebreakers) ? insight.icebreakers : [];
  const followUps = Array.isArray(insight.followUps) ? insight.followUps : [];

  return (
    <section className="panel" style={{ padding: 24, display: "grid", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p className="eyebrow">Business Brief</p>
          <h2 style={{ margin: "8px 0 0", fontSize: 28 }}>公司洞察与沟通建议</h2>
        </div>
        <span className="pill">
          最近更新 · {formatDateTime(insight.generatedAt)}
        </span>
      </div>

      <div className="grid">
        <div>
          <h3>公司摘要</h3>
          <p className="subtitle">{insight.companySummary}</p>
        </div>

        <div>
          <h3>公司新闻 / 动态 / 资讯</h3>
          <InsightList items={companyNews} emptyText="暂时没有可展示的公司动态。" />
        </div>

        <div>
          <h3>行业动态</h3>
          <InsightList items={industryUpdates} emptyText="暂时没有可展示的行业观察。" />
        </div>

        <div>
          <h3>聊天破冰话题</h3>
          <InsightList items={icebreakers} emptyText="暂时没有推荐的破冰话题。" />
        </div>

        <div>
          <h3>跟进建议</h3>
          <InsightList items={followUps} emptyText="暂时没有建议的跟进动作。" />
        </div>
      </div>
    </section>
  );
}

function InsightList({
  items,
  emptyText,
}: {
  items: string[];
  emptyText: string;
}) {
  if (!items.length) {
    return <p className="subtitle">{emptyText}</p>;
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10 }}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
