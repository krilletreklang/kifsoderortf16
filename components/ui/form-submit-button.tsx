"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

interface FormSubmitButtonProps extends ComponentProps<typeof Button> {
  pendingText?: string;
  successText?: string;
  idleContent?: ReactNode;
}

export function FormSubmitButton({
  pendingText = "Sparar…",
  successText,
  idleContent,
  children,
  disabled,
  onClick,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const [showSuccess, setShowSuccess] = useState(false);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (showTimerRef.current !== null) window.clearTimeout(showTimerRef.current);
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (onClick) {
      onClick(event);
    }

    if (!successText) {
      return;
    }

    if (showTimerRef.current !== null) window.clearTimeout(showTimerRef.current);
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);

    setShowSuccess(false);
    showTimerRef.current = window.setTimeout(() => setShowSuccess(true), 600);
    hideTimerRef.current = window.setTimeout(() => setShowSuccess(false), 2200);
  }

  return (
    <Button
      type="submit"
      aria-busy={pending}
      disabled={pending || disabled}
      onClick={handleClick}
      {...props}
    >
      {pending ? pendingText : showSuccess && successText ? successText : idleContent ?? children}
    </Button>
  );
}
