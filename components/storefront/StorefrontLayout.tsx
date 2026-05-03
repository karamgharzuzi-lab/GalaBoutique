import { ToastProvider } from "@/components/ui/Toast";
import Header from "./Header";
import BottomNav from "./BottomNav";

interface StorefrontLayoutProps {
  locale: string;
  children: React.ReactNode;
}

export default function StorefrontLayout({ locale, children }: StorefrontLayoutProps) {
  return (
    <ToastProvider>
      <Header locale={locale} />
      <main className="min-h-screen pb-20 md:pb-0">{children}</main>
      <BottomNav locale={locale} />
    </ToastProvider>
  );
}
