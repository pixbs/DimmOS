import * as Icons from "@remixicon/react";

interface IconProps {
    name: string;
    size?: 16 | 24 | 32;
    variant?: "fill" | "line" | "none";
}

export default function Icon(props: IconProps) {
    const { name, size = 24, variant = "fill" } = props;
    const iconName = `Ri${name}${variant === "none" ? "" : variant === "line" ? "Line" : "Fill"}`;
    const IconComponent = (
        Icons as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>
    )[iconName];
    
    if (!IconComponent) {
        console.warn(
            `Icon "${iconName}" not found in @remixicon/react`,
        )
        return null;
    }

    return <IconComponent width={size} height={size} />;
}