import { RadioGroup, Radio } from "@headlessui/react";
import type { ReactNode } from "react";

interface UIRadioOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly description?: string;
}

interface UIRadioGroupProps<T extends string> {
  readonly value: T;
  readonly options?: readonly UIRadioOption<T>[];
  readonly onChange: (value: T) => void;
  readonly "aria-label"?: string;
  readonly children?: ReactNode;
}

export function UIRadioGroup<T extends string>({ value, options, onChange, children, ...rest }: UIRadioGroupProps<T>) {
  return (
    <RadioGroup value={value} onChange={onChange} aria-label={rest["aria-label"]} className="ui-radio-group">
      {children ??
        options?.map((option) => (
          <UIRadioOption key={option.value} value={option.value} label={option.label} description={option.description} />
        ))}
    </RadioGroup>
  );
}

export function UIRadioOption<T extends string>({ value, label, description }: UIRadioOption<T>) {
  return (
    <Radio value={value} className="ui-radio-option">
      <span className="ui-radio-option__indicator" />
      <span className="ui-radio-option__content">
        <span className="ui-radio-option__label">{label}</span>
        {description ? <span className="ui-radio-option__description">{description}</span> : null}
      </span>
    </Radio>
  );
}

export { Radio } from "@headlessui/react";
