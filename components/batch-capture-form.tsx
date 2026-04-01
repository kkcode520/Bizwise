"use client";

import { ChangeEvent, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScanResult } from "@/types";

type BatchItem = {
  localId: string;
  fileName: string;
  preview: string;
  source?: "ai" | "mock";
  status: "queued" | "processing" | "ready" | "error" | "saved";
  form: ScanResult;
  error?: string;
  internalDuplicate?: string;
  existingDuplicate?: {
    id: string;
    name: string;
    company: string;
    title: string;
    createdAt: string;
  } | null;
  existingDuplicateAction?: "overwrite" | "create" | "skip" | null;
};

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

export function BatchCaptureForm() {
  const router = useRouter();
  const batchGalleryInputRef = useRef<HTMLInputElement>(null);
  const batchCameraInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [status, setStatus] = useState(
    "一次上传多张名片，系统会批量提取基础信息。批量模式仅保存联系人，不生成行业洞察。"
  );
  const [isPending, startTransition] = useTransition();

  const canSave = useMemo(() => {
    return items.some(
      (item) =>
        item.status === "ready" &&
        !item.internalDuplicate &&
        (item.form.name || item.form.company || item.form.title)
    );
  }, [items]);

  const applyInternalDuplicateFlags = (currentItems: BatchItem[]) => {
    const keyMap = new Map<string, string[]>();

    for (const item of currentItems) {
      const name = item.form.name.trim().toLowerCase();
      const company = item.form.company.trim().toLowerCase();

      if (!name || !company) {
        continue;
      }

      const key = `${name}__${company}`;
      keyMap.set(key, [...(keyMap.get(key) || []), item.localId]);
    }

    return currentItems.map((item) => {
      const name = item.form.name.trim().toLowerCase();
      const company = item.form.company.trim().toLowerCase();

      if (!name || !company) {
        return { ...item, internalDuplicate: undefined };
      }

      const key = `${name}__${company}`;
      const duplicates = keyMap.get(key) || [];

      return {
        ...item,
        internalDuplicate:
          duplicates.length > 1 ? "当前批次内已存在相同的姓名 + 公司，请移除或修改其中一条。" : undefined,
      };
    });
  };

  const processFiles = async (files: File[]) => {
    if (!files.length) {
      return;
    }

    setStatus(`正在准备 ${files.length} 张名片图片...`);

    const optimized = await Promise.all(
      files.map(async (file, index) => ({
        localId: `${Date.now()}_${index}`,
        fileName: file.name || `名片 ${index + 1}`,
        preview: await optimizeImage(file),
        source: undefined,
        status: "queued" as const,
        form: { ...initialForm },
      }))
    );

    setItems((current) =>
      applyInternalDuplicateFlags([
        ...current,
        ...optimized.map((item) => ({
          ...item,
          status: "processing" as const,
          existingDuplicate: null,
          existingDuplicateAction: null,
        })),
      ])
    );
    setStatus(`正在批量识别 ${optimized.length} 张名片...`);

    startTransition(async () => {
      const response = await fetch("/api/scan/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: optimized.map((item) => item.preview),
        }),
      });

      if (!response.ok) {
        setItems((current) =>
          applyInternalDuplicateFlags(
            current.map((item) =>
            optimized.some((pendingItem) => pendingItem.localId === item.localId)
              ? {
                  ...item,
                  status: "error",
                  error: "批量识别失败，请重新尝试。",
                }
              : item
            )
          )
        );
        setStatus("批量识别失败，请重新上传。");
        return;
      }

      const result = (await response.json()) as {
        items: Array<{ data: ScanResult; source: "ai" | "mock" }>;
      };

      setItems((current) =>
        applyInternalDuplicateFlags(current.map((item) => {
          const matchedIndex = optimized.findIndex((pendingItem) => pendingItem.localId === item.localId);

          if (matchedIndex < 0) {
            return item;
          }

          return {
            ...item,
            form: result.items[matchedIndex]?.data || { ...initialForm },
            source: result.items[matchedIndex]?.source || "mock",
            status: "ready",
            existingDuplicate: null,
            existingDuplicateAction: null,
          };
        }))
      );
      setStatus("批量识别完成，请检查后统一保存联系人。");
    });
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    await processFiles(files);
    event.target.value = "";
  };

  const updateItem = (localId: string, nextForm: ScanResult) => {
    setItems((current) =>
      applyInternalDuplicateFlags(
        current.map((item) =>
          item.localId === localId
            ? {
                ...item,
                form: nextForm,
                existingDuplicate: null,
                existingDuplicateAction: null,
              }
            : item
        )
      )
    );
  };

  const removeItem = (localId: string) => {
    setItems((current) => applyInternalDuplicateFlags(current.filter((item) => item.localId !== localId)));
  };

  const setExistingDuplicateAction = (
    localId: string,
    action: "overwrite" | "create" | "skip"
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.localId === localId
          ? {
              ...item,
              existingDuplicateAction: action,
            }
          : item
      )
    );
  };

  const saveBatch = async () => {
    const readyItems = items
      .filter((item) => item.status === "ready")
      .filter((item) => item.form.name || item.form.company || item.form.title);

    if (!readyItems.length) {
      setStatus("请至少保留一条可保存的联系人记录。");
      return;
    }

    const internalDuplicates = readyItems.filter((item) => item.internalDuplicate);

    if (internalDuplicates.length) {
      setStatus("当前批次内存在重复名片，请先移除或修改重复项后再保存。");
      return;
    }

    const duplicateCheckResponse = await fetch("/api/contacts/batch/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contacts: readyItems.map((item) => ({
          localId: item.localId,
          name: item.form.name,
          company: item.form.company,
        })),
      }),
    });

    if (!duplicateCheckResponse.ok) {
      setStatus("重复联系人检查失败，请稍后重试。");
      return;
    }

    const duplicateCheckResult = (await duplicateCheckResponse.json()) as {
      items: Array<{
        localId: string;
        duplicate: BatchItem["existingDuplicate"];
      }>;
    };

    const duplicateMap = new Map(
      duplicateCheckResult.items
        .filter((item) => item.duplicate)
        .map((item) => [item.localId, item.duplicate])
    );

    const nextItems = items.map((item) => {
      const duplicate = duplicateMap.get(item.localId) || null;

      if (!duplicate) {
        return {
          ...item,
          existingDuplicate: null,
          existingDuplicateAction: null,
        };
      }

      return {
        ...item,
        existingDuplicate: duplicate,
        existingDuplicateAction:
          item.existingDuplicateAction && item.existingDuplicate?.id === duplicate.id
            ? item.existingDuplicateAction
            : null,
      };
    });

    setItems(nextItems);

    const unresolvedExistingDuplicates = nextItems.filter(
      (item) => item.existingDuplicate && !item.existingDuplicateAction
    );

    if (unresolvedExistingDuplicates.length) {
      setStatus("检测到与联系人库重复的名片，请先选择“覆盖原记录 / 继续新建 / 跳过”。");
      return;
    }

    const contacts = nextItems
      .filter((item) => item.status === "ready")
      .filter((item) => item.form.name || item.form.company || item.form.title)
      .map((item) => ({
        localId: item.localId,
        ...item.form,
        cardImage: item.preview,
        overwriteExistingId:
          item.existingDuplicateAction === "overwrite" ? item.existingDuplicate?.id : undefined,
        forceCreate: item.existingDuplicateAction === "create" ? true : undefined,
        skip: item.existingDuplicateAction === "skip" ? true : undefined,
      }));

    const actionableContacts = contacts.filter((item) => !item.skip);

    if (!actionableContacts.length) {
      setStatus("当前批次已全部跳过，没有需要保存的联系人。");
      return;
    }

    setStatus(`正在保存 ${actionableContacts.length} 条联系人...`);

    const response = await fetch("/api/contacts/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contacts: actionableContacts }),
    });

    if (!response.ok) {
      setStatus("批量保存失败，请稍后重试。");
      return;
    }

    setItems((current) =>
      current.map((item) => ({
        ...item,
        status: "saved",
      }))
    );
    setStatus("联系人已批量保存，正在前往联系人列表。");
    router.push("/contacts");
  };

  return (
    <>
      <section className="grid" style={{ gap: 20 }}>
        <section className="panel" style={{ padding: 24, display: "grid", gap: 18 }}>
        <div>
          <p className="eyebrow">Batch Intake</p>
          <h2 style={{ margin: "10px 0 0", fontSize: 34 }}>批量上传或批量录入名片</h2>
        </div>

        <p className="subtitle">
          适合会议、展会或拜访后一次录入多张名片。你可以从相册批量选择，也可以拍一张追加一张。批量模式只保存基础联系人信息，不生成洞察。
        </p>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          style={{
            minHeight: 180,
            borderRadius: 24,
            border: "1.5px dashed rgba(15,118,110,0.35)",
            background: "rgba(255,255,255,0.55)",
            display: "grid",
            placeItems: "center",
            padding: 24,
            textAlign: "center",
            width: "100%",
            cursor: "pointer",
          }}
        >
          <div>
            <strong style={{ display: "block", fontSize: 18 }}>批量导入多张名片</strong>
            <span style={{ color: "var(--muted)" }}>点击后选择来源。相册支持一次选多张；相机模式支持拍一张后继续追加下一张</span>
          </div>
        </button>

        <input
          ref={batchGalleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          style={{ display: "none" }}
        />
        <input
          ref={batchCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFiles}
          style={{ display: "none" }}
        />

        <div className="pill">{isPending ? "批量处理中..." : status}</div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="button" type="button" disabled={!canSave || isPending} onClick={saveBatch}>
            批量保存联系人
          </button>
          <button className="button ghost" type="button" onClick={() => setItems([])}>
            清空批量列表
          </button>
        </div>
        </section>

        {items.length ? (
          <section className="grid" style={{ gap: 16 }}>
            <section
              className="panel"
              style={{ padding: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}
            >
              <strong style={{ fontSize: 16 }}>继续追加名片</strong>
              <button
                className="button ghost"
                type="button"
                onClick={() => batchCameraInputRef.current?.click()}
              >
                再拍一张
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => batchGalleryInputRef.current?.click()}
              >
                从相册继续追加
              </button>
            </section>
          {items.map((item, index) => (
            <article key={item.localId} className="panel" style={{ padding: 22, display: "grid", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <p className="eyebrow">Card {index + 1}</p>
                  <h3 style={{ margin: "8px 0 0", fontSize: 24 }}>{item.fileName}</h3>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="pill">
                    {item.status === "saved"
                      ? "已保存"
                      : item.source === "ai"
                        ? "AI 识别"
                        : item.status === "error"
                          ? "识别失败"
                          : "待确认"}
                  </span>
                  <button className="button ghost" type="button" onClick={() => removeItem(item.localId)}>
                    移除
                  </button>
                </div>
              </div>

              {item.internalDuplicate ? (
                <div
                  style={{
                    color: "#9f1239",
                    background: "rgba(244, 63, 94, 0.08)",
                    border: "1px solid rgba(244, 63, 94, 0.18)",
                    borderRadius: 16,
                    padding: "12px 14px",
                  }}
                >
                  {item.internalDuplicate}
                </div>
              ) : null}

              {item.existingDuplicate ? (
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px solid rgba(245, 158, 11, 0.24)",
                    borderRadius: 16,
                    padding: "14px 16px",
                  }}
                >
                  <strong>联系人库中已存在同名同公司记录</strong>
                  <span style={{ color: "var(--muted)" }}>
                    已有联系人：{item.existingDuplicate.name} / {item.existingDuplicate.company} /{" "}
                    {item.existingDuplicate.title || "未填写职位"}
                  </span>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      className={item.existingDuplicateAction === "overwrite" ? "button" : "button ghost"}
                      type="button"
                      onClick={() => setExistingDuplicateAction(item.localId, "overwrite")}
                    >
                      覆盖原记录
                    </button>
                    <button
                      className={item.existingDuplicateAction === "create" ? "button" : "button ghost"}
                      type="button"
                      onClick={() => setExistingDuplicateAction(item.localId, "create")}
                    >
                      继续新建
                    </button>
                    <button
                      className={item.existingDuplicateAction === "skip" ? "button" : "button ghost"}
                      type="button"
                      onClick={() => setExistingDuplicateAction(item.localId, "skip")}
                    >
                      跳过这条
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="grid two-col" style={{ alignItems: "start" }}>
                <img
                  src={item.preview}
                  alt={`${item.fileName} preview`}
                  style={{ width: "100%", borderRadius: 20, objectFit: "cover", minHeight: 240 }}
                />

                <div className="grid" style={{ gap: 14 }}>
                  <BatchField
                    label="姓名"
                    value={item.form.name}
                    onChange={(value) => updateItem(item.localId, { ...item.form, name: value })}
                  />
                  <BatchField
                    label="公司"
                    value={item.form.company}
                    onChange={(value) => updateItem(item.localId, { ...item.form, company: value })}
                  />
                  <BatchField
                    label="职位"
                    value={item.form.title}
                    onChange={(value) => updateItem(item.localId, { ...item.form, title: value })}
                  />
                  <BatchField
                    label="手机号"
                    value={item.form.phone || ""}
                    onChange={(value) => updateItem(item.localId, { ...item.form, phone: value })}
                  />
                  <BatchField
                    label="邮箱"
                    value={item.form.email || ""}
                    onChange={(value) => updateItem(item.localId, { ...item.form, email: value })}
                  />
                  <BatchField
                    label="公司地址"
                    value={item.form.address || ""}
                    onChange={(value) => updateItem(item.localId, { ...item.form, address: value })}
                  />
                  <BatchField
                    label="官网"
                    value={item.form.website || ""}
                    onChange={(value) => updateItem(item.localId, { ...item.form, website: value })}
                  />
                  <div className="field">
                    <label>备注</label>
                    <textarea
                      value={item.form.note || ""}
                      onChange={(event) =>
                        updateItem(item.localId, { ...item.form, note: event.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
          </section>
        ) : null}
      </section>

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
              width: "min(100%, 440px)",
              padding: 24,
              display: "grid",
              gap: 14,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <p className="eyebrow">Select Source</p>
              <h3 style={{ margin: "8px 0 0", fontSize: 26 }}>选择批量录入来源</h3>
            </div>
            <p className="subtitle" style={{ margin: 0 }}>
              你可以一次从相册选择多张名片，也可以先拍一张，再继续追加下一张。
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                className="button"
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  batchGalleryInputRef.current?.click();
                }}
              >
                从相册批量选择
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  batchCameraInputRef.current?.click();
                }}
              >
                拍一张并追加
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

function BatchField({
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
