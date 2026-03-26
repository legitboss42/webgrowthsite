"use client";

import { useEffect } from "react";
import { setClarityTags, type AnalyticsParams } from "@/lib/analytics";

export default function ClarityPageTags({ tags }: { tags: AnalyticsParams }) {
  useEffect(() => {
    setClarityTags(tags);
  }, [tags]);

  return null;
}
