"use client";
import { useState } from "react";
import styles from "./style.module.css";
import Shortcut from "@/components/molecules/actors/shortcut";
import ResizeHandles from "@/components/molecules/actors/resize-handles";
import Dimm from "@/components/molecules/actors/dimm";

export default function Actor(props: ActorProps) {
  const [gridColumn, setGridColumn] = useState<number>(2);
  const [gridRow, setGridRow] = useState<number>(2);

  const renderActor = () => {
    switch (props.type.actorType) {
      case "shortcut":
        return <Shortcut title={props.type.title} icon={props.type.icon} />;
      case "dimm":
        return <Dimm />;
      default:
        return null;
    }
  };

  return (
    <div
      className={styles.actor}
      style={{
        gridColumn: `span ${gridColumn}`,
        gridRow: `span ${gridRow}`,
      }}
    >
      {renderActor()}
      <ResizeHandles
        gridColumn={gridColumn}
        gridRow={gridRow}
        onColumnChange={setGridColumn}
        onRowChange={setGridRow}
        keepAspectRatio={props.type.actorType === "dimm"}
      />
    </div>
  );
}
