"use client";

import type { ComponentProps } from "react";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

interface ConfirmSubmitButtonProps extends ComponentProps<typeof FormSubmitButton> {
  confirmMessage: string;
}

export function ConfirmSubmitButton({ confirmMessage, onClick, ...props }: ConfirmSubmitButtonProps) {
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  }

  return <FormSubmitButton {...props} onClick={handleClick} />;
}
