"use client";

/* eslint-disable @next/next/no-img-element -- Tenant media URLs are validated by the website snapshot contract. */

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ContentColumn, ContentColumnMedia, HomepageSection } from "../contracts";
import { safeDestination, safeImageSource } from "../safe-values";

function ColumnMedia({ media, onPlay }: { media: ContentColumnMedia; onPlay: (media: ContentColumnMedia) => void }) {
  if (media.type === "image") {
    const src = safeImageSource(media.src);
    return src ? <div className="sf-content-column-media" data-fit={media.fit}><img src={src} alt={media.alt} loading="lazy" /></div> : null;
  }
  const title = media.title || "Video";
  const thumbnail = media.type === "youtube" ? `https://i.ytimg.com/vi/${media.videoId}/hqdefault.jpg` : safeImageSource(media.src);
  return <button type="button" className="sf-content-column-media sf-content-column-video" aria-label={`Play ${title}`} onClick={() => onPlay(media)}>{media.type === "youtube" ? <img src={thumbnail ?? ""} alt="" loading="lazy" /> : <video src={thumbnail ?? ""} muted preload="metadata" />}<span aria-hidden="true">{"\u25B6"}</span>{media.title && <strong>{media.title}</strong>}</button>;
}

export function ContentColumnsSection({ section, preview }: { section: HomepageSection; preview: boolean }) {
  const [player, setPlayer] = useState<ContentColumnMedia | null>(null);
  useEffect(() => {
    if (!player) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setPlayer(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [player]);
  const media = (column: ContentColumn) => column.media && <ColumnMedia media={column.media} onPlay={(item) => !preview && setPlayer(item)} />;
  return <><section className="sf-section sf-width sf-content-columns" data-section-id={section.id} style={{ "--sf-content-count": section.columns?.length ?? 1 } as React.CSSProperties}>
    {section.columns?.map((column) => {
      const mediaOnly = !column.subject && !column.body && !column.cta.text;
      const destination = safeDestination(column.cta.href);
      return <article className={`sf-content-column${mediaOnly ? " sf-content-column--media-only" : ""}`} key={column.id}>
        {column.media?.placement === "top" && media(column)}
        {!mediaOnly && <div className="sf-content-column-copy" data-position={column.contentPosition ?? "top-left"}>{column.subject && <><h3>{column.subject}</h3><i data-width={column.lineWidth} aria-hidden="true" /></>}{column.body && <p>{column.body}</p>}{column.cta.text && (destination && !preview ? <Link className="sf-primary-button" href={destination}>{column.cta.text}</Link> : <button type="button" className="sf-primary-button" disabled={preview}>{column.cta.text}</button>)}</div>}
        {column.media?.placement === "bottom" && media(column)}
      </article>;
    })}
  </section>{player && !preview && <div className="sf-content-video-modal" role="dialog" aria-modal="true" aria-label={player.title || "Video"} onMouseDown={(event) => event.target === event.currentTarget && setPlayer(null)}><div><button type="button" aria-label="Close video" onClick={() => setPlayer(null)}>{"\u00D7"}</button>{player.type === "youtube" ? <iframe src={`https://www.youtube-nocookie.com/embed/${player.videoId}?autoplay=1&rel=0`} title={player.title || "Video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <video src={safeImageSource(player.src) ?? ""} controls autoPlay />}</div></div>}</>;
}
