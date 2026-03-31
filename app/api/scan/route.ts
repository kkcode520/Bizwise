import { NextResponse } from "next/server";
import { extractCardFieldsWithOpenAI } from "@/lib/openai";
import { ScanResult } from "@/types";

const mockScanResult: ScanResult = {
  name: "王岚",
  company: "澄观咨询",
  title: "商务发展经理",
  phone: "139-8888-5566",
  email: "lan.wang@clearview.example.com",
  address: "北京市朝阳区望京SOHO",
  website: "https://clearview.example.com",
  note: "在行业沙龙交换名片，可关注企业服务合作。",
};

export async function POST(request: Request) {
  const { image } = (await request.json()) as { image?: string };

  try {
    const result = await extractCardFieldsWithOpenAI(image);

    if (result) {
      return NextResponse.json({ data: result, source: "ai" });
    }
  } catch (error) {
    console.error("AI scan failed", error);
  }

  return NextResponse.json({ data: mockScanResult, source: "mock" });
}
