export default function ERPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary">Nexora</h1>
          <span className="text-sm text-muted-foreground">ERP</span>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
