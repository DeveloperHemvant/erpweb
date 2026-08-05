import { DashboardLayout } from "@/layouts/dashboard-layout";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
