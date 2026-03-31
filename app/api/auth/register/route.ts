import { NextResponse } from "next/server";
import { createUser, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
  };

  const name = body.name?.trim() || "";
  const email = body.email?.trim() || "";
  const password = body.password || "";

  if (!name || !email || password.length < 8) {
    return NextResponse.json(
      { error: "请填写姓名、有效邮箱和至少 8 位密码" },
      { status: 400 }
    );
  }

  try {
    const user = await createUser({ name, email, password });
    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    console.error("register failed", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
