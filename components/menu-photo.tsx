import Image from "next/image";

const demoPanels: Record<string, string> = {
  chicken: "0% 0%",
  kofta: "100% 0%",
  feteer: "0% 100%",
  lemonade: "100% 100%",
};

export function MenuPhoto({ src, className = "" }: { src: string; className?: string }) {
  const panel = src.startsWith("/demo-food-grid.png#") ? src.split("#")[1] : null;
  if (panel && demoPanels[panel]) {
    return (
      <div
        role="img"
        aria-label=""
        className={className}
        style={{ backgroundImage: "url('/demo-food-grid.png')", backgroundSize: "200% 200%", backgroundPosition: demoPanels[panel] }}
      />
    );
  }
  if (src.startsWith("data:") || src.startsWith("/__demo-file")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" loading="lazy" className={className} />;
  }
  return <Image src={src} alt="" fill sizes="(max-width:640px) 96px, 112px" className={className} />;
}
