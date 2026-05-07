import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import type { ReactNode } from "react";

interface UIMenuItemDef {
  readonly key: string;
  readonly label: string;
  readonly onClick: () => void;
  readonly danger?: boolean;
  readonly disabled?: boolean;
}

interface UIMenuProps {
  readonly trigger: ReactNode;
  readonly items: readonly UIMenuItemDef[];
  readonly anchor?: "bottom end" | "bottom start" | "top end" | "top start";
  readonly "aria-label"?: string;
  readonly triggerClassName?: string;
}

export function UIMenu({ trigger, items, anchor = "bottom end", triggerClassName, ...rest }: UIMenuProps) {
  return (
    <Menu>
      <MenuButton className={triggerClassName ?? "icon-button"} aria-label={rest["aria-label"]}>
        {trigger}
      </MenuButton>
      <MenuItems anchor={anchor} transition className="ui-menu__items">
        {items.map((item) => (
          <MenuItem key={item.key} disabled={item.disabled}>
            <button
              className={`ui-menu__item ${item.danger ? "ui-menu__item--danger" : ""}`}
              type="button"
              onClick={item.onClick}
            >
              {item.label}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
