"use client";

import Link from "next/link";

import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface HeaderChunkProps {
  storeUrl: string;
}

export const GetStarted = ({ storeUrl }: HeaderChunkProps) => {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center gap-x-2 mt-8">
        <Skeleton className="w-[200px] h-12 bg-slate-100" />
        <Skeleton className="w-[200px] h-12 bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      {storeUrl ? (
        <Link href={"/" + storeUrl}>
          <Button variant={"default"} size={"lg"} className='h-12'>
            Open Dashboard
          </Button>
        </Link>
      ) : (
        <Link href="/create-store">
          <Button variant={"default"} size={"lg"} className='h-12'>
            Create Store
          </Button>
        </Link>
      )}
    </div>
  );
};
