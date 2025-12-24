export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>

      <p className="text-lg text-muted-foreground mb-6">
        This page does not exist.
      </p>

      <a
        href="/"
        className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-secondary transition"
      >
        Go home
      </a>
    </div>
  );
}
