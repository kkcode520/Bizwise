import { NextResponse } from "next/server";
import { requireSessionUser, setSessionCookie, updateUserProfile } from "@/lib/auth";

export async function PATCH(request: Request) {
  const sessionUser = await requireSessionUser();
  const body = (await request.json()) as { name?: string; email?: string };
  const name = body.name?.trim() || "";
  const email = body.email?.trim() || "";

  if (!name || !email) {
    return NextResponse.json({ error: "姓名和邮箱不能为空" }, { status: 400 });
  }

  try {
    const user = await updateUserProfile({
      userId: sessionUser.id,
      name,
      email,
    });
    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return NextResponse.json({ error: "该邮箱已被使用" }, { status: 409 });
    }

    console.error("profile update failed", error);
    return NextResponse.json({ error: "资料更新失败" }, { status: 500 });
  }
}
