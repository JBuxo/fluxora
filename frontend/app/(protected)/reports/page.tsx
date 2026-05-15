export default function ReportsPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-center text-muted-foreground">
        This is a protected area. Only authenticated users can see this.
      </p>
    </div>
  );
}
