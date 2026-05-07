import { Checkbox } from "@headlessui/react";

interface UICheckboxProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly "aria-label"?: string;
}

export function UICheckbox({ checked, onChange, disabled, ...rest }: UICheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="ui-checkbox"
      aria-label={rest["aria-label"]}
    >
      <svg className="ui-checkbox__check" viewBox="0 0 14 14" fill="none">
        <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Checkbox>
  );
}
