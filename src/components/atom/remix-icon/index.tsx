"use client";
import * as RemixIcons from "@remixicon/react";
import type { ComponentType, SVGProps } from "react";

type RemixIconProps = SVGProps<SVGSVGElement> & {
  icon?: string | null;
  size?: number | string;
  variant?: "fill" | "line";
};

/**
 * Converts a simple icon name (e.g., "home") to a React component name (e.g., "RiHomeFill")
 */
function nameToComponentName(
  name: string,
  variant: "fill" | "line" = "fill",
): string {
  // Convert name to PascalCase and add Ri prefix and variant suffix
  // e.g., "home" -> "RiHomeFill", "arrow-left" -> "RiArrowLeftFill"
  const pascalName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  const variantSuffix = variant.charAt(0).toUpperCase() + variant.slice(1);
  return `Ri${pascalName}${variantSuffix}`;
}

export default function RemixIcon({
  icon,
  size = 24,
  variant = "fill",
  ...props
}: RemixIconProps) {
  if (!icon) return null;

  const componentName = nameToComponentName(icon, variant);
  const IconComponent = (
    RemixIcons as Record<string, ComponentType<SVGProps<SVGSVGElement>>>
  )[componentName];

  if (!IconComponent) {
    console.warn(
      `Icon "${icon}" (${componentName}) not found in @remixicon/react`,
    );
    return null;
  }

  return <IconComponent width={size} height={size} {...props} />;
}
