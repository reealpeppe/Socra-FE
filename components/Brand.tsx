import Image from "next/image";
import styles from "./Brand.module.css";

export function Brand({ compact = false, variant = "light" }: {
  compact?: boolean;
  variant?: "light" | "dark";
}) {
  const asset = compact ? "socra-symbol" : "socra-logo";
  const suffix = variant === "light" ? "-light" : "";

  return (
    <span className={`${styles.brand}${compact ? ` ${styles.compact}` : ""}`}>
      <Image
        className={styles.image}
        src={`/brand/${asset}${suffix}.svg`}
        alt="Socra"
        width={compact ? 32 : 124}
        height={compact ? 32 : 36}
        loading="eager"
        unoptimized
      />
    </span>
  );
}
