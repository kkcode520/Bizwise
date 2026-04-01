import { NextResponse } from "next/server";
import { extractCardFieldsWithOpenAI } from "@/lib/openai";
import { ScanResult } from "@/types";

function createFallbackScanResult(index: number): ScanResult {
  return {
    name: `待确认联系人 ${index + 1}`,
    company: "",
    title: "",
    phone: "",
    email: "",
    address: "",
    website: "",
    note: "系统未能完整识别，请手动补充后保存。",
  };
}

export async function POST(request: Request) {
  const { images } = (await request.json()) as { images?: string[] };

  if (!Array.isArray(images) || !images.length) {
    return NextResponse.json({ error: "请至少上传一张名片图片" }, { status: 400 });
  }

  const items: Array<{ data: ScanResult; source: "ai" | "mock" }> = [];

  for (const [index, image] of images.entries()) {
    try {
      const result = await extractCardFieldsWithOpenAI(image);

      if (result) {
        items.push({ data: result, source: "ai" });
        continue;
      }
    } catch (error) {
      console.error("Batch AI scan failed", error);
    }

    items.push({
      data: createFallbackScanResult(index),
      source: "mock",
    });
  }

  return NextResponse.json({ items });
}
