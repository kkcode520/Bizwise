import OpenAI from "openai";
import { ContactInsight, ScanResult } from "@/types";

const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
const model =
  process.env.AI_MODEL || process.env.OPENAI_MODEL || "qwen3.5-plus";
const baseURL =
  process.env.AI_BASE_URL ||
  process.env.OPENAI_BASE_URL ||
  "https://coding.dashscope.aliyuncs.com/v1";

function getClient() {
  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL,
    timeout: 120000,
  });
}

function readMessageText(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "type" in item &&
          item.type === "text" &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          return item.text;
        }

        return "";
      })
      .join("");
  }

  return "";
}

export async function generateInsightsWithOpenAI(payload: {
  name: string;
  company: string;
  title: string;
  note?: string;
}): Promise<ContactInsight | null> {
  const client = getClient();

  if (!client) {
    return null;
  }

  const prompt = `
你是 BizWise 的商务助理。请基于联系人信息，输出 JSON：
{
  "companySummary": "string",
  "companyNews": ["string"],
  "industryUpdates": ["string"],
  "icebreakers": ["string"],
  "followUps": ["string"]
}

要求：
1. 语言使用简体中文。
2. 不要输出 markdown。
3. 不确定时，给出保守、泛化但实用的建议。
4. companyNews 3 条，industryUpdates 3 条，icebreakers 3 条，followUps 2 条。
5. companyNews 更偏向公司新闻、近期动态、公开资讯或值得关注的经营动向；如果缺少明确公开信息，可给出保守且可用于沟通的“近期关注点”。

联系人信息：
姓名：${payload.name}
公司：${payload.company}
职位：${payload.title}
备注：${payload.note || "无"}
`;

  const response = await client.chat.completions.create({
    model,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: "你是 BizWise 的商务助理，请严格输出 JSON，不要输出 markdown。",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = readMessageText(response.choices[0]?.message?.content);
  const parsed = JSON.parse(text) as Omit<ContactInsight, "generatedAt" | "source">;

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
    source: "ai",
  };
}

export async function extractCardFieldsWithOpenAI(base64Image?: string): Promise<ScanResult | null> {
  const client = getClient();

  if (!client || !base64Image) {
    return null;
  }

  const response = await client.chat.completions.create({
    model,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              '请识别这张商务名片，并只输出 JSON：{"name":"","company":"","title":"","phone":"","email":"","address":"","website":"","note":""}。无法确定的字段可返回空字符串。',
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image,
            },
          },
        ],
      },
    ],
  });

  const text = readMessageText(response.choices[0]?.message?.content);

  return JSON.parse(text) as ScanResult;
}
