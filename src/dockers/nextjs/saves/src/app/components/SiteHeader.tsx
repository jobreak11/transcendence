import Link from "next/link";

type SiteHeaderProps = {
  activePage?: "about" | "statistics" | "history" | "settings";
};

const navigation = [
  { label: "About", href: "/about", key: "about" },
  { label: "Statistics", href: "/statistics", key: "statistics" },
  { label: "History", href: "/history", key: "history" },
  { label: "Settings", href: "/settings", key: "settings" },
] as const;

export default function SiteHeader({
  activePage = "settings",
}: SiteHeaderProps) {
  return (
    <header className="border-b-[6px] border-red-600 bg-black">
      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-10">
            <Link
              href="/"
              className="font-serif text-4xl font-semibold text-yellow-300 sm:text-5xl"
            >
              นั่งเทียน789
            </Link>

            <p className="font-serif text-xl font-semibold text-yellow-200 sm:text-3xl">
              เทพ Poker since 1942
            </p>
          </div>

          <div className="flex items-center gap-6 text-lg sm:text-xl">
            <button
              type="button"
              className="rounded px-2 py-1 transition hover:bg-white/10"
              aria-label="Change language to English"
            >
              🇺🇸 <span className="ml-1">EN</span>
            </button>

            <button
              type="button"
              className="underline underline-offset-4 transition hover:text-red-400"
            >
              Logout
            </button>
          </div>
        </div>

        <nav
          aria-label="Main navigation"
          className="mt-8 grid grid-cols-2 sm:grid-cols-4"
        >
          {navigation.map((item) => {
            const isActive = activePage === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "rounded-t-2xl px-4 py-4 text-center text-xl font-medium",
                  "transition-colors sm:text-2xl",
                  isActive
                    ? "bg-red-600 text-white"
                    : "text-white hover:bg-white/10",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}