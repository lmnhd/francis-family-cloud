"use client";

import { useState, useCallback } from "react";
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import type { FileRecord } from "@/lib/repos/files";

interface Props {
  files: FileRecord[];
  previewUrls: (string | undefined)[];
  initialIndex: number;
  onClose: () => void;
}

// Fetches the presigned S3 URL as JSON rather than following the redirect.
async function fetchMediaUrl(fileId: string): Promise<string> {
  const res = await fetch(`/api/files/${fileId}/download?json=1`);
  const { url } = await res.json();
  return url as string;
}

export function MediaLightbox({ files, previewUrls, initialIndex, onClose }: Props) {
  // Cache resolved S3 URLs (images already have previewUrl, videos/audio need fetching).
  const [resolved, setResolved] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    files.forEach((f, i) => {
      if (previewUrls[i]) init[f.id] = previewUrls[i]!;
    });
    return init;
  });

  const resolve = useCallback(
    async (index: number) => {
      const file = files[index];
      if (!file || resolved[file.id]) return;
      const url = await fetchMediaUrl(file.id);
      setResolved((prev) => ({ ...prev, [file.id]: url }));
    },
    [files, resolved]
  );

  const slides = files.map((file, i) => {
    const isVideo = file.mimeType.startsWith("video/");
    const url = resolved[file.id] ?? "";

    if (isVideo) {
      return {
        type: "video" as const,
        title: file.displayName,
        sources: url ? [{ src: url, type: file.mimeType }] : [],
        poster: previewUrls[i],
      };
    }

    return {
      type: "image" as const,
      src: url,
      alt: file.displayName,
      title: file.displayName,
    };
  });

  return (
    <Lightbox
      open
      close={onClose}
      index={initialIndex}
      slides={slides}
      plugins={[Video, Zoom, Captions, Thumbnails]}
      on={{
        view: async ({ index }) => {
          // Pre-resolve current slide and its neighbours.
          await Promise.allSettled([
            resolve(index),
            resolve(index + 1),
            resolve(index - 1),
          ]);
        },
      }}
      zoom={{ maxZoomPixelRatio: 4 }}
      captions={{ showToggle: files.length > 1 }}
      thumbnails={{ position: "bottom", width: 80, height: 60 }}
    />
  );
}

/** Returns true for file types the lightbox can display. */
export function isLightboxable(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType.startsWith("video/");
}
