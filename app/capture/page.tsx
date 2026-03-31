import { CaptureForm } from "@/components/capture-form";
import { SiteHeader } from "@/components/site-header";
import { requireSessionUser } from "@/lib/auth";

export default async function CapturePage() {
  await requireSessionUser();

  return (
    <>
      <SiteHeader />
      <main className="shell section">
        <CaptureForm />
      </main>
    </>
  );
}
