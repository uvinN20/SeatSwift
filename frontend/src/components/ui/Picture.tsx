import { ASSETS } from "../../config/assets";
import { useState } from "react";
import manifest from "../../config/image-manifest.json";
type ImageSpec = { width: number; height: number; placeholder: string; avif: string; webp: string; jpeg: string; small: string; original?: string };
export default function Picture({ name, alt = "", priority = false, className = "", sizes }: { name: string; alt?: string; priority?: boolean; className?: string; sizes?: string }) {
 const spec = (manifest as Record<string, ImageSpec>)[name]; const [loaded, setLoaded] = useState(false); const [failed, setFailed] = useState(false);
 if (!spec || failed) return <div className={`landscape-fallback ${className}`} role={alt ? "img" : undefined} aria-label={alt ? "Illustrated landscape; destination photography not installed" : undefined}><img src={ASSETS.landscapeFallback} alt="" width="1600" height="1000" loading={priority ? "eager" : "lazy"} /><span className="illustration-label">Landscape illustration</span></div>;
 return <div className={`responsive-picture ${loaded ? "is-loaded" : ""} ${className}`} style={{ backgroundImage: `url(${spec.placeholder})` }}><picture>
   <source media="(prefers-reduced-data: reduce)" srcSet={spec.small}/><source type="image/avif" srcSet={spec.avif} sizes={sizes ?? (priority ? "100vw" : "(max-width: 640px) 100vw, 40vw")}/><source type="image/webp" srcSet={spec.webp} sizes={sizes ?? (priority ? "100vw" : "(max-width: 640px) 100vw, 40vw")}/>
   <img src={spec.original ?? spec.small} srcSet={spec.jpeg} sizes={sizes ?? (priority ? "100vw" : "(max-width: 640px) 100vw, 40vw")} alt={alt} width={spec.width} height={spec.height} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)}/>
 </picture></div>;
}
