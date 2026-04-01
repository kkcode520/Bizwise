import { CaptureWorkspace } from "@/components/capture-workspace";
import { SiteHeader } from "@/components/site-header";
import { requireSessionUser } from "@/lib/auth";

export default async function CapturePage() {
  await requireSessionUser();

  return (
    <>
      <SiteHeader />
      <main className="shell section">
        <CaptureWorkspace />
      </main>
    </>
  );
}
