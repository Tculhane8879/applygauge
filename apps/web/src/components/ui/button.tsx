import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "destructive" | "destructive-subtle";
export type ButtonSize = "default" | "compact";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-muted",
  ghost: "bg-transparent text-ink hover:bg-surface-muted",
  destructive: "bg-danger text-white hover:bg-danger-hover",
  "destructive-subtle":
    "bg-transparent text-danger hover:bg-red-50 hover:text-danger-hover",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "min-h-10 px-4 py-2",
  compact: "min-h-9 px-3 py-1.5 text-sm",
};

export function buttonStyles({
  className,
  size = "default",
  variant = "primary",
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
} = {}) {
  return [
    "focus-ring inline-flex items-center justify-center rounded-lg font-semibold transition-colors motion-reduce:transition-none",
    "disabled:cursor-not-allowed disabled:opacity-55",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, size, variant, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        className={buttonStyles({ className, size, variant })}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);
