import { cn } from "@/lib/utils"

interface LoadingProps {
  size?: "sm" | "md" | "lg"
  variant?: "button" | "page"
  text?: string
  className?: string
}

export function Loading({ size = "md", variant = "page", text, className }: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  }

  if (variant === "button") {
    return (
      <div className="flex items-center gap-2">
        <div className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", sizeClasses[size], className)} />
        {text && <span className="text-sm">{text}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <div className={cn("animate-spin rounded-full border-4 border-current border-t-transparent text-emerald-600", sizeClasses[size], className)} />
      {text && <p className="text-muted-foreground">{text}</p>}
    </div>
  )
} 