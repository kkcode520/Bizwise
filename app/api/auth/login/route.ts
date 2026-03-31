import { NextResponse } from "next/server";
import { authenticateUser, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = body.email?.trim() || "";
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
  }

  try {
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("login failed", error);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
