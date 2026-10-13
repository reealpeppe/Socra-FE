"use client";

import { useEffect, useState } from "react";
import { clientGet } from "@/lib/api";
import type { PublicProfile } from "@/lib/types";
import { UserAvatar } from "./Ui";
import styles from "./ProfileAvatar.module.css";

export function ProfileAvatar({ userId, name, src }: { userId?: string; name: string; src?: string | null }) {
  const [photo, setPhoto] = useState<{ userId: string; src: string | null } | null>(null);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  useEffect(() => {
    if (!userId || src !== undefined) return;
    let active = true;
    clientGet<PublicProfile>(`/profiles/${encodeURIComponent(userId)}`)
      .then(profile => { if (active) setPhoto({ userId, src: profile.avatar_url || null }); })
      .catch(() => { if (active) setPhoto({ userId, src: null }); });
    return () => { active = false; };
  }, [userId, src]);
  const source = src !== undefined ? src : photo && photo.userId === userId ? photo.src : null;
  return <span className={styles.avatar} aria-hidden="true">
    <UserAvatar name={name} size="lg" />
    {source && source !== failedSource ?
      // Public profiles supply backend-sanitized images, including small data URLs.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={source} alt="" onError={() => setFailedSource(source)} /> : null}
  </span>;
}
