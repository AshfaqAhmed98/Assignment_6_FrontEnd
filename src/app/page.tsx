export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="max-w-xl space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Equipment Rental Platform
        </p>
        <h1 className="text-5xl font-bold tracking-tight">GearRent</h1>
        <p className="text-lg text-muted-foreground">
          Rent the equipment you need, when you need it.
        </p>
      </section>
    </main>
  );
}
