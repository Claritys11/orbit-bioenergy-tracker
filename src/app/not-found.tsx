import { Card, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="max-w-md text-center">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The ORBIT page or trace identifier could not be found.</p>
        <LinkButton href="/" className="mt-5">Return home</LinkButton>
      </Card>
    </main>
  );
}
