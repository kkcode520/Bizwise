"use client";

import { ChangeEvent, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScanResult } from "@/types";

const initialForm: ScanResult = {
  name: "",
  company: "",
  title: "",
  phone: "",
  email: "",
  address: "",
  website: "",
  note: "",
};

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

async function optimizeImage(file: File) {
  const rawDataUrl = await fileToDataUrl(file);

  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const maxWidth = 1600;
      const scale = Math.min(1, maxWidth / image.width);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("图片处理失败"));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => reject(new Error("图片处理失败"));
    image.src = rawDataUrl;
  });
}

export function CaptureForm() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [form, setForm] = useState<ScanResult>(initialForm);
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    id: string;
    name: string;
    company: string;
    title: string;
  } | null>(null);
  const [status, setStatus] = useState(
    "拍摄或上传商务名片后，系统会自动识别关键信息，并生成可编辑的联系人档案。"
  );
  const [isPending, startTransition] = useTransition();

  const canSave = useMemo(() => {
    return Boolean(form.name || form.company || form.title);
  }, [form]);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await optimizeImage(file);
    setPreview(dataUrl);
    setStatus("正在压缩并识别名片字段...");

    startTransition(async () => {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: dataUrl }),
      });

      const result = (await response.json()) as { data: ScanResult; source: string };
      setForm(result.data);
      setStatus(
        result.source === "ai"
          ? "识别完成，请检查字段并保存联系人。"
          : "识别完成，请检查字段并保存联系人。"
      );
    });
  };

  const saveContact = async () => {
    const payload = { ...form, cardImage: preview };

    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 409) {
      const result = (await response.json()) as {
        duplicate?: { id: string; name: string; company: string; title: string };
      };
      const duplicate = result.duplicate;

      if (!duplicate) {
        setStatus("检测到重复联系人，但未拿到原记录信息，请稍后重试。");
        return;
      }

      setDuplicatePrompt(duplicate);
      return;
    }

    if (!response.ok) {
      setStatus("保存失败，请先确认已登录，再重新尝试。");
      return;
    }

    const result = (await response.json()) as { id: string };
    router.push(`/contacts/${result.id}`);
  };

  const resolveDuplicate = async (mode: "overwrite" | "create") => {
    if (!duplicatePrompt) {
      return;
    }

    const payload = { ...form, cardImage: preview };
    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        mode === "overwrite"
          ? { ...payload, overwriteExistingId: duplicatePrompt.id }
          : { ...payload, forceCreate: true }
      ),
    });

    if (!response.ok) {
      setStatus("重复联系人处理失败，请稍后重试。");
      setDuplicatePrompt(null);
      return;
    }

    const result = (await response.json()) as { id: string; mode: "create" | "overwrite" };
    setDuplicatePrompt(null);
    setStatus(result.mode === "overwrite" ? "已覆盖原有联系人记录。" : "已新增一条重复联系人记录。");
    router.push(`/contacts/${result.id}`);
  };

  return (
    <>
      <div className="grid two-col">
        <section className="panel" style={{ padding: 24, display: "grid", gap: 18 }}>
        <div>
          <p className="eyebrow">Business Card</p>
          <h1 style={{ margin: "10px 0 0", fontSize: 36 }}>拍摄或上传商务名片</h1>
        </div>

        <p className="subtitle">
          建议横向拍摄，确保姓名、公司与职位区域清晰。你可以直接拍照，也可以从相册中选择已有名片图片。
        </p>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          style={{
            minHeight: 260,
            borderRadius: 24,
            border: "1.5px dashed rgba(15,118,110,0.35)",
            background: "rgba(255,255,255,0.55)",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            width: "100%",
            padding: 0,
            cursor: "pointer",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Business card preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: 24 }}>
              <strong style={{ display: "block", fontSize: 18 }}>点击选择拍照或从相册上传</strong>
              <span style={{ color: "var(--muted)" }}>手机端支持相机拍摄和相册选择，桌面端支持本地图片上传</span>
            </div>
          )}
        </button>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          style={{ display: "none" }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />

        <div className="pill">{isPending ? "处理中..." : status}</div>
        </section>

        <section className="panel" style={{ padding: 24, display: "grid", gap: 16 }}>
        <div>
          <p className="eyebrow">Contact Details</p>
          <h2 style={{ margin: "10px 0 0", fontSize: 30 }}>识别结果确认</h2>
        </div>

        <div className="grid" style={{ gap: 14 }}>
          <FormField label="姓名" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <FormField
            label="公司"
            value={form.company}
            onChange={(value) => setForm({ ...form, company: value })}
          />
          <FormField
            label="职位"
            value={form.title}
            onChange={(value) => setForm({ ...form, title: value })}
          />
          <FormField
            label="手机号"
            value={form.phone || ""}
            onChange={(value) => setForm({ ...form, phone: value })}
          />
          <FormField
            label="邮箱"
            value={form.email || ""}
            onChange={(value) => setForm({ ...form, email: value })}
          />
          <FormField
            label="公司地址"
            value={form.address || ""}
            onChange={(value) => setForm({ ...form, address: value })}
          />
          <FormField
            label="官网"
            value={form.website || ""}
            onChange={(value) => setForm({ ...form, website: value })}
          />
          <div className="field">
            <label htmlFor="note">备注</label>
            <textarea
              id="note"
              value={form.note || ""}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              placeholder="比如：交换名片的场景、合作方向、用户兴趣点"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="button" disabled={!canSave} onClick={saveContact}>
            保存联系人
          </button>
          <button className="button ghost" onClick={() => setForm(initialForm)}>
            清空
          </button>
        </div>
        </section>
      </div>

      {duplicatePrompt ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.28)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 50,
          }}
        >
          <div
            className="panel"
            style={{
              width: "min(100%, 440px)",
              padding: 24,
              display: "grid",
              gap: 14,
            }}
          >
            <div>
              <p className="eyebrow">Duplicate Contact</p>
              <h3 style={{ margin: "8px 0 0", fontSize: 26 }}>检测到重复联系人</h3>
            </div>
            <p className="subtitle" style={{ margin: 0 }}>
              已有联系人：{duplicatePrompt.name} / {duplicatePrompt.company} /{" "}
              {duplicatePrompt.title || "未填写职位"}
            </p>
            <p className="subtitle" style={{ margin: 0 }}>
              请选择操作：覆盖原记录、继续新建，或取消本次添加。
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="button" type="button" onClick={() => void resolveDuplicate("overwrite")}>
                覆盖原记录
              </button>
              <button className="button ghost" type="button" onClick={() => void resolveDuplicate("create")}>
                新建一条记录
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => {
                  setDuplicatePrompt(null);
                  setStatus("已取消本次添加。");
                }}
              >
                取消添加
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pickerOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.28)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 49,
          }}
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="panel"
            style={{
              width: "min(100%, 420px)",
              padding: 24,
              display: "grid",
              gap: 14,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <p className="eyebrow">Select Source</p>
              <h3 style={{ margin: "8px 0 0", fontSize: 26 }}>选择名片来源</h3>
            </div>
            <p className="subtitle" style={{ margin: 0 }}>
              你可以立即拍照，也可以从相册中选择已有名片图片。
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                className="button"
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  cameraInputRef.current?.click();
                }}
              >
                立即拍照
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  galleryInputRef.current?.click();
                }}
              >
                从相册选择
              </button>
              <button className="button ghost" type="button" onClick={() => setPickerOpen(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function FormField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
