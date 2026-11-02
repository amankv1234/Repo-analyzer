import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xl">
        404
      </div>
      <h2 className="text-xl font-bold">Page or Repository Not Found</h2>
      <p className="text-sm text-slate-400 max-w-sm">
        The requested resource does not exist or has been removed.
      </p>
      <Link href="/">
        <Button>Return to Home</Button>
      </Link>
    </div>
  );
}

