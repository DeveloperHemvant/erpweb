import { DashboardLayout } from "@/layouts/dashboard-layout";

export default function RoutesEntityLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
