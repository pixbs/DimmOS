import Icon from "@/components/atoms/icon";
import styles from "./style.module.css";
import Link from "next/link";

type ShortcutProps = {
    name: string;
    href: string;
    icon?: string;
    color?: 'green' | 'yellow' | 'blue' | 'red';
    hasTitle?: boolean;
}

export default function Shortcut(props: ShortcutProps) {
    const { name, color = 'yellow', href, hasTitle = true, icon = "Folder" } = props

    return (
        <Link href={href} className={styles.shortcut}>
            <div className={`${styles.icon} ${styles[`icon-${color}`]}`}>
                <Icon name={icon} size={24} variant="fill" />
            </div>
            {hasTitle && (
            <p>
                {name}
            </p>
            )}
        </Link>
    )
}