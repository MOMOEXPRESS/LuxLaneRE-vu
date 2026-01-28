interface LuxlaneLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "mark"
}

export function LuxlaneLogo({ className = "", size = "md", variant = "default" }: LuxlaneLogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  }

  if (variant === "mark") {
    return <div className={`font-semibold tracking-tight ${sizeClasses[size]} ${className}`}>L</div>
  }

  return <div className={`font-semibold tracking-tight ${sizeClasses[size]} ${className}`}>LUXLANE</div>
}
