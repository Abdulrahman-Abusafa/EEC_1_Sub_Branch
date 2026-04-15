export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white -mt-24">
      {/* We need to use a client component for the sidebar so it can usePathname */}
      <AdminSidebarClientWrapper />
      <main className="flex-1 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

// Inline component. In Next.js App Router, we can just import the client component.
import AdminSidebar from "@/components/admin/AdminSidebar";

function AdminSidebarClientWrapper() {
  return <AdminSidebar />;
}
