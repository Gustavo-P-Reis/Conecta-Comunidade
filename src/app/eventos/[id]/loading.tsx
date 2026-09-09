import { Skeleton } from "@/components/ui/skeleton";

export default function EventLoading() {
  return (
    <div className="container-app py-8 lg:py-12">
      <Skeleton className="mb-6 h-5 w-40" />
      <Skeleton className="mb-8 aspect-[16/9] w-full rounded-xl sm:aspect-[21/9]" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_23rem]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
}
