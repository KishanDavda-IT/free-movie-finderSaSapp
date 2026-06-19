"use client";

import { EARN } from "@/lib/earn";
import { useEffect, useRef } from "react";

type Props = {
  id: string;
  className?: string;
  style?: React.CSSProperties;
};

export function AdSlot({ id, className = "", style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!EARN.adsEnabled) return;

    const el = ref.current;
    if (!el) return;

    el.dataset.adSlot = id;

    // Trigger a custom event so an external ad script can pick up the slot.
    const evt = new CustomEvent("adslot:mount", { detail: { id, el } });
    window.dispatchEvent(evt);
  }, [id]);

  if (!EARN.adsEnabled) return null;

  return (
    <div
      ref={ref}
      id={`ad-${id}`}
      className={className}
      style={style}
      data-ad-slot={id}
    />
  );
}
