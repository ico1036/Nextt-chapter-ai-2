import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppTabBar from "./components/AppTabBar";

export const metadata: Metadata = {
  title: "My Next Chapter AI — 내가 다시 시작할 수 있는 일의 방향 찾기",
  description:
    "다시 시작하려는 사람을 위한 AI 진단. 초기·예비 창업자, 이민자 엄마 누구든 15분이면, 내 경험으로 시작할 수 있는 일의 방향 하나가 선명해져요.",
  openGraph: {
    title: "My Next Chapter AI",
    description:
      "내 경험으로 다시 시작할 수 있는 일의 방향 하나를, AI와 함께 찾아보세요.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-dvh antialiased">
        {children}
        <AppTabBar />
      </body>
    </html>
  );
}
