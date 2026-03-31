"use client";

import { ChangeEvent, useMemo, useState, useTransition } from "react";
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
  const [preview, setPreview] = useState<string>("");
  const [form, setForm] = useState<ScanResult>(initialForm);
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
    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...form, cardImage: preview }),
    });

    if (!response.ok) {
      setStatus("保存失败，请先确认已登录，再重新尝试。");
      return;
    }

    const result = (await response.json()) as { id: string };
    router.push(`/contacts/${result.id}`);
  };

  return (
    <div className="grid two-col">
      <section className="panel" style={{ padding: 24, display: "grid", gap: 18 }}>
        <div>
          <p className="eyebrow">Business Card</p>
          <h1 style={{ margin: "10px 0 0", fontSize: 36 }}>拍摄或上传商务名片</h1>
        </div>

        <p className="subtitle">
          建议横向拍摄，确保姓名、公司与职位区域清晰。移动端可直接调用摄像头。
        </p>

        <label
          htmlFor="card-upload"
          style={{
            minHeight: 260,
            borderRadius: 24,
            border: "1.5px dashed rgba(15,118,110,0.35)",
            background: "rgba(255,255,255,0.55)",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
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
              <strong style={{ display: "block", fontSize: 18 }}>点击拍照或上传图片</strong>
              <span style={{ color: "var(--muted)" }}>支持手机相机、相册和桌面拖拽选择</span>
            </div>
          )}
        </label>

        <input
          id="card-upload"
          type="file"
          accept="image/*"
          capture="environment"
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
