"use client";

import { useState } from "react";
import { CaptureForm } from "@/components/capture-form";
import { BatchCaptureForm } from "@/components/batch-capture-form";

export function CaptureWorkspace() {
  const [mode, setMode] = useState<"single" | "batch">("single");

  return (
    <section className="grid" style={{ gap: 20 }}>
      <section className="panel" style={{ padding: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          className={mode === "single" ? "button" : "button ghost"}
          type="button"
          onClick={() => setMode("single")}
        >
          单张录入
        </button>
        <button
          className={mode === "batch" ? "button" : "button ghost"}
          type="button"
          onClick={() => setMode("batch")}
        >
          批量录入
        </button>
      </section>

      {mode === "single" ? <CaptureForm /> : <BatchCaptureForm />}
    </section>
  );
}
