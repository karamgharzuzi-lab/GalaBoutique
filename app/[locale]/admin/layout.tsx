import type { Metadata } from "next";

/**
 * Admin section layout — overrides the PWA manifest so that
 * "Add to Home Screen" from any admin page installs the Admin PWA
 * (start_url: /en/admin/dashboard) instead of the storefront PWA.
 */
export const metadata: Metadata = {
  title: {
    default: "GalaBoutique Admin",
    template: "%s — GB Admin",
  },
  description: "GalaBoutique admin panel",
  manifest: "/manifest.admin.json",
  themeColor: "#3B1F0F",
};

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
