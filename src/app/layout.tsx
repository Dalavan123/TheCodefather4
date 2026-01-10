import { getSessionUser } from "@/backend/auth/session";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body>
        <LayoutWrapper user={user}>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
