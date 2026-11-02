import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingRepo() {
  return (
    <div className="min-h-screen bg-slate-950 p-8 space-y-6 max-w-7xl mx-auto">
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

