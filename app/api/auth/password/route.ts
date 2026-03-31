import { NextResponse } from "next/server";
import { changeUserPassword, requireSessionUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  const sessionUser = await requireSessionUser();
  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  const currentPassword = body.currentPassword || "";
  const newPassword = body.newPassword || "";

  if (!currentPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "请输入当前密码和至少 8 位的新密码" },
      { status: 400 }
    );
  }

  try {
    await changeUserPassword({
      userId: sessionUser.id,
      currentPassword,
      newPassword,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_PASSWORD") {
      return NextResponse.json({ error: "当前密码错误" }, { status: 401 });
    }

    console.error("password change failed", error);
    return NextResponse.json({ error: "密码修改失败" }, { status: 500 });
  }
}
