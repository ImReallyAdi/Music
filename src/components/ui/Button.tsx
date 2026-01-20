import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {

    // Base styles
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold uppercase tracking-wider transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px";

    // Size styles
    const sizeStyles = {
      default: "h-12 px-6 py-3", // Mobile standard
      sm: "h-10 px-4",
      lg: "h-14 px-8", // Desktop standard
      icon: "h-12 w-12",
    };

    // Variant styles
    const variantStyles = {
      primary: cn(
        "text-accent relative group overflow-hidden bg-transparent",
        // We will handle the underline via a child element or pseudo-element
      ),
      secondary: cn(
        "border border-foreground text-foreground bg-transparent hover:bg-foreground hover:text-background",
        "rounded-none" // Sharp corners
      ),
      ghost: "text-muted-foreground hover:text-foreground bg-transparent relative group",
      destructive: "text-destructive hover:text-destructive/80 bg-transparent",
      link: "text-primary underline-offset-4 hover:underline",
    };

    return (
      <button
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        ref={ref}
        {...props}
      >
        {children}

        {/* Animated Underline for Primary */}
        {variant === 'primary' && (
           <span className="absolute bottom-2 left-0 w-full h-0.5 bg-accent transform scale-x-100 group-hover:scale-x-110 transition-transform origin-center" />
        )}

        {/* Animated Underline for Ghost */}
        {variant === 'ghost' && (
           <span className="absolute bottom-2 left-0 w-full h-px bg-foreground transform scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
