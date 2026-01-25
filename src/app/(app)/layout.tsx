import { getSessionUser } from "@/backend/auth/session";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return <LayoutWrapper user={user}>{children}</LayoutWrapper>;
}
