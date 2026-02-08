import styles from "./style.module.css";

interface TitleProps {
    title: string;
    description?: string;
    align?: 'left' | 'center' | 'right';
}

export default function Title(props : TitleProps) {
    const { title, description, align = 'left' } = props
    
    return (
        <div className={styles.container}>
            <h1 className={styles.title} style={{textAlign: align}}>{title}</h1>
            {description && <p className={styles.description} style={{textAlign: align}}>{description}</p>}
        </div>
    )
}