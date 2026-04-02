export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.98_0_0),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.22_0_0),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,oklch(0.2_0_0)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.2_0_0)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="w-full max-w-sm px-4 relative">
        <div className="rounded-2xl border bg-background/70 backdrop-blur shadow-sm p-6 motion-reduce:animate-none animate-in fade-in zoom-in-95 duration-200">
          {children}
        </div>
      </div>
    </div>
  )
}