import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-2">
      <h2 className="text-3xl font-bold">Something Went Wrong</h2>

      <p className="text-center text-muted-foreground max-w-sm">
        We couldn&apos;t find the resource you&apos;re looking for, try again
        later. If you think this is an error please report it to us so we can
        fix it as soon as possible.
      </p>

      <div className="flex gap-2 mt-4">
        <Button>
          <Link href="/dashboard">Try Again</Link>
        </Button>

        <Button variant="outline">
          <Link href="/report-issue">Report Issue</Link>
        </Button>
      </div>
    </div>
  );
}
