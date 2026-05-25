export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-start justify-center p-8 pt-16">
      <div className="w-full max-w-2xl">{children}</div>
    </main>
  );
}
