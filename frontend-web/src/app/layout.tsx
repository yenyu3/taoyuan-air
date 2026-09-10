import type { Metadata } from "next";
import { TopNav } from "@/components/navigation/TopNav";
import { RoleRouteGuard } from "@/components/navigation/RoleRouteGuard";
import { ChatFab } from "@/components/ai/ChatFab";
import { LoginButtonProvider } from "@/lib/login-button-context";
import "./globals.css";

const APP_ICON_URL = "/logo.png";

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
        <LoginButtonProvider>
          <TopNav />
          <RoleRouteGuard>
            <main style={{ paddingTop: 80 }}>{children}</main>
          </RoleRouteGuard>
          <ChatFab />
        </LoginButtonProvider>
      </body>
    </html>
  );
}
