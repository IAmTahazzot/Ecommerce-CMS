import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { CoverImage } from "./components/CoverImage";
import { HeaderChunk } from "./components/HeaderChunk";
import { currentUser } from "@clerk/nextjs";
import { db } from "@/db/db";
import { GetStarted } from "./components/GetStarted";
import Image from "next/image";

const UnityShopMainPage = async () => {
  const user = await currentUser();
  let storeUrl: string = "";

  if (user) {
    const store = await db.store.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (store) {
      storeUrl = store.storeUrl;
    }
  }

  return (
    <div>
        <Container className="max-w-[1200px]">
          <header className="flex items-center justify-between">
            <div className='flex gap-x-2 items-center'>
              <Image src='/brand.svg' width={24} height={24} alt="Unity Shop" />
              <h1 className="text-normal font-bold select-none cursor-pointer group/logo space-x-1">
                Unity Shop
              </h1>
            </div>
            <HeaderChunk storeUrl={storeUrl} />
          </header>

          <section className="flex flex-col gap-y-4 mt-32 text-center">
            <div className="flex items-center justify-center w-fit mx-auto py-1 px-3 gap-2 rounded-full bg-slate-100 dark:bg-neutral-700 border border-slate-200 dark:border-neutral-900 text-xs">
              <span>🎉</span>
              <span>Explore more by signing up</span>
            </div>
            <h1 className="text-6xl font-extrabold tracking-tighter leading-[1.12] text-neutral-900 dark:text-neutral-100">
              Power Your Vision: <span className="rounded">UnityShop </span>CMS,
              Your Digital Shop Management
            </h1>
            <div className="h-12">
              {user ? (
                <GetStarted storeUrl={storeUrl} />
              ) : (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button variant={"default"} size={"lg"} className="h-12">
                    Get Started
                  </Button>
                  <Button variant={"outline"} size={"lg"} className="h-12">
                    Learn More
                  </Button>
                </div>
              )}
            </div>
          </section>

          <section className="mt-32">
            <CoverImage />
          </section>
        </Container>
    </div>
  );
};

export default UnityShopMainPage;
