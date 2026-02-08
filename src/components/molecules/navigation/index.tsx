import Icon from '@/components/atoms/icon';
import styles from './style.module.css'
import Link from 'next/link';

interface NavigationProps {
    backHref?: string;
    title: string;
    actions?: {
        icon: string;
        label: string;
        variant?: "fill" | "line" | "none";
        href: string;
    }[];
}

export default function Navigation(props: NavigationProps) {
    const { backHref, actions = [] } = props
    return (
        <div className={styles.navigation}>
            <div className={styles.grabber} />
            <div className={styles.content}>
                <div className={styles.container}>
                    <Link href={backHref || "/"}>
                        <Icon name="ArrowLeftS" variant='line' />
                    </Link>
                </div>
                <p className={styles.title}>
                    {props.title}
                </p>
                <div className={styles.container}>
                    {actions.map((action, index) => (
                        <Link href={action.href} key={index} className={styles.action}>
                            <Icon name={action.icon} variant={action.variant} />
                        </Link>
                    ))}
                </div>

            </div>
        </div>

    )
}