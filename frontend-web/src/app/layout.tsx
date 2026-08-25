import type { Metadata } from "next";
import { TopNav } from "@/components/navigation/TopNav";
import { ChatFab } from "@/components/ai/ChatFab";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const APP_ICON_URL = "/icon.png?v=1787303369";

export const metadata: Metadata = {
  title: "Taoyuan Air Monitor",
  icons: {
    icon: APP_ICON_URL,
    shortcut: APP_ICON_URL,
    apple: APP_ICON_URL,
  },
  description: "桃園市空氣品質即時監測",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Browser extensions can inject attributes before React hydrates the app.
    <html lang="zh-TW" suppressHydrationWarning>
      <body style={{ minHeight: '100vh' }}>
        <AuthProvider>
          <TopNav />
          <main style={{ paddingTop: 80 }}>{children}</main>
          <ChatFab />
        </AuthProvider>
      </body>
    </html>
  );
}
