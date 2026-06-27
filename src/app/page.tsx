import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      {/* Mobile banner */}
      <Image
        src="/banner-mobile-dump.png"
        alt="Dump"
        width={941}
        height={1672}
        priority
        sizes="100vw"
        className="block sm:hidden w-full h-auto"
      />

      {/* Desktop banner */}
      <Image
        src="/banner-desktop-dump.png"
        alt="Dump"
        width={1535}
        height={1024}
        priority
        sizes="100vw"
        className="hidden sm:block w-full h-auto"
      />
    </main>
  );
}
