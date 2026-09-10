"use client";

import { forwardRef, MouseEventHandler } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, type = "button", disabled, onClick }, ref) => {
    const variants = {
      primary: "bg-brand-orange text-brand-black hover:bg-brand-orange-hover",
      secondary: "bg-brand-gray text-white hover:bg-zinc-700",
      outline: "border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-brand-black",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors duration-200",
          variants[variant],
          sizes[size],
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;