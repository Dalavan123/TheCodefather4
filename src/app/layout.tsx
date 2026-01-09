import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body>
        <nav style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
          <Link href="/" style={{ marginRight: 12 }}>Home</Link>
          <Link href="/documents" style={{ marginRight: 12 }}>Documents</Link>
        </nav>

        <main style={{ padding: 16 }}>{children}</main>
      </body>
    </html>
  );
}
