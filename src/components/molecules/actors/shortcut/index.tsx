"use client";
import RemixIcon from "@/components/atom/remix-icon";
import styles from "./style.module.css";
import useTileSize from "@/hooks/useTileSize";

type ShortcutProps = Omit<
  Extract<ActorProps["type"], { actorType: "shortcut" }>,
  "actorType"
>;

export default function Shortcut({ title, icon }: ShortcutProps) {
  const containerRef = useTileSize<HTMLDivElement>();

  return (
    <div ref={containerRef} className={styles.shortcut}>
      <RemixIcon icon={icon} size={24} className={styles.icon} />
      <p className={styles.title}>{title}</p>
    </div>
  );
}
