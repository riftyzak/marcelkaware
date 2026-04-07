"use client";

export function AuthPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-48px-68px)] items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
      <div className="w-full max-w-[980px] space-y-7">
        <h1 className="text-[2.2rem] font-semibold tracking-tight text-white sm:text-[2.5rem]">{title}</h1>
        {children}
      </div>
    </div>
  );
}
