"use client";

import dynamic from "next/dynamic";

const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

export default function GlobeWrapper() {
  return <Globe />;
}
