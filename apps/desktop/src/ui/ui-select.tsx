import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";

interface UISelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

interface UISelectProps {
  readonly value: string;
  readonly options: readonly UISelectOption[];
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly "aria-label"?: string;
  readonly placeholder?: string;
}

export function UISelect({ value, options, onChange, disabled, className, placeholder, ...rest }: UISelectProps) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? "";

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={`ui-select ${className ?? ""}`}>
        <ListboxButton className="ui-select__button" aria-label={rest["aria-label"]}>
          <span className="ui-select__label">{selectedLabel}</span>
          <span className="ui-select__chevron" aria-hidden="true">▾</span>
        </ListboxButton>
        <ListboxOptions anchor="bottom start" transition className="ui-select__options">
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="ui-select__option"
            >
              {option.label}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
