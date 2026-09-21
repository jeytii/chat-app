import type { LucideIcon } from 'lucide-react'

interface IconProps {
    iconNode?: LucideIcon | null;
    className?: string;
}

export function Icon({ iconNode: IconComponent, className }: IconProps) {
    return IconComponent ? <IconComponent className={className} /> : null
}
