"use client";

import Dither from "@/components/Dither";
import FadeContent from "@/components/FadeContent";
import ShinyText from "@/components/ShinyText";
import { Button } from "@/components/ui/button";
import { HomepageBlocks } from "@/components/content/homepage-blocks";
import { useConvexAuth } from "convex/react";
import { RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const aboutItems = [
  {
    icon: ShieldCheck,
    title: "Safety first",
    body: "We focus on keeping access stable, account-based, and dependable. The goal is a setup that feels clean to use and trustworthy to manage.",
  },
  {
    icon: RefreshCw,
    title: "Always updated",
    body: "The product keeps moving with regular updates, improvements, and fixes. Release notes and changes stay close to the platform so you always know what’s new.",
  },
  {
    icon: Users,
    title: "Customer focused",
    body: "Feedback matters. The people using the product help shape where it goes.",
  },
] as const;

export function HomePortal() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  function onGetAccess() {
    if (isAuthenticated) {
      router.push("/purchase");
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("auth:next", "/purchase");
    }

    router.push("/login");
  }

  return (
    <div className="pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#070c12]">
        <div className="relative min-h-screen">
          <div className="absolute inset-0 mix-blend-screen opacity-[0.46]">
            <Dither
              colorNum={4}
              disableAnimation={false}
              enableMouseInteraction={false}
              mouseRadius={0.4}
              pixelSize={1}
              waveAmplitude={0.16}
              waveColor={[1, 1, 1]}
              waveFrequency={1.7}
              waveSpeed={0.035}
            />
          </div>
          <div className="absolute inset-0 bg-[#070c12]/78" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070c12]/24 via-[#070c12]/08 to-[#070c12]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.055),transparent_42%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,12,18,0.08),rgba(7,12,18,0.005),rgba(7,12,18,0.12))]" />

          <div className="relative mx-auto flex min-h-screen max-w-[1240px] items-center justify-center px-4 py-24 text-center sm:px-6">
            <div className="max-w-6xl space-y-7">
              <div className="space-y-4">
                <p className="mx-auto max-w-6xl text-[3.25rem] font-semibold leading-[0.98] tracking-tight text-white sm:text-[4rem] lg:text-[4rem]">
                  Next level CS2 experience with
                </p>
                <p className="text-[3.25rem] font-semibold leading-none tracking-tight sm:text-[4rem] lg:text-[4rem]">
                  <span className="relative inline-block">
                    <span className="text-[#8fb0d8]">marcelka</span>
                    <span className="text-white">ware</span>
                    <span aria-hidden className="pointer-events-none absolute inset-0">
                      <ShinyText
                        className="text-white"
                        color="rgba(255,255,255,0.04)"
                        delay={0.5}
                        direction="left"
                        pauseOnHover={false}
                        shineColor="#ffffff"
                        speed={1}
                        spread={110}
                        text="marcelkaware"
                        yoyo={false}
                      />
                    </span>
                  </span>
                </p>
              </div>

              <p className="mx-auto max-w-xl text-[1.05rem] leading-7 text-slate-300/85 sm:text-[1.1rem]">
                Feel the marcelkaware.
              </p>

              <div className="flex items-center justify-center">
                <Button
                  className="h-11 rounded-xl border-0 bg-[#8fb0d8] px-6 text-[#0b1015] hover:bg-[#a3bee0]"
                  onClick={onGetAccess}
                >
                  Get access
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1160px] px-4 sm:px-6">
        <FadeContent duration={0.7}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              About <span className="text-[#8fb0d8]">us</span>
            </h2>
            <p className="mt-2 text-lg text-slate-400">What defines us</p>
          </div>
        </FadeContent>

        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {aboutItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <FadeContent delay={index * 0.1} duration={0.7} key={item.title}>
                <div className="mx-auto flex h-full max-w-sm flex-col items-center text-center">
                  <div className="mb-5 text-[#8fb0d8]">
                    <Icon className="h-10 w-10" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-4 text-base leading-8 text-slate-300/78">{item.body}</p>
                </div>
              </FadeContent>
            );
          })}
        </div>
      </section>

      {/* CMS blocks */}
      <div className="mx-auto mt-20 max-w-[1160px] px-4 sm:px-6">
        <HomepageBlocks excludeTypes={["heroSupportText", "trustStrip"]} fallback={false} />
      </div>
    </div>
  );
}
