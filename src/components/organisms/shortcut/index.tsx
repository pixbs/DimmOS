import Icon from "@/components/atoms/icon";
import styles from "./style.module.css";
import Link from "next/link";

type ShortcutProps = {
    name: string;
    color?: 'green' | 'yellow' | 'blue' | 'red';
    href: string;
}

export default function Shortcut(props: ShortcutProps) {
    const { name, color = 'yellow', href } = props

    return (
        <Link href={href} className={styles.shortcut}>
            <div className={`${styles.icon} ${styles[`icon-${color}`]}`}>
                <Icon name="Folder" size={24} variant="fill" />
            </div>
            <p>
                {name}
            </p>
        </Link>
    )
}