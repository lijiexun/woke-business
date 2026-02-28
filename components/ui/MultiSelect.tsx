"use client";

export type MultiSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Option = string | MultiSelectOption;

type Props = {
  value: string[];
  options: Option[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

function optionValue(option: Option): string {
  return typeof option === "string" ? option : option.value;
}

function optionLabel(option: Option): string {
  if (typeof option === "string") return option || "(blank)";
  return option.label || option.value || "(blank)";
}

function optionDisabled(option: Option): boolean {
  return typeof option === "string" ? false : Boolean(option.disabled);
}

export function MultiSelect({ value, options, onChange, placeholder = "Select..." }: Props) {
  return (
    <select
      multiple
      className="select h-28"
      value={value}
      onChange={(e) => {
        const next = Array.from(e.target.selectedOptions).map((o) => o.value);
        onChange(next);
      }}
    >
      {!options.length && <option>{placeholder}</option>}
      {options.map((opt) => (
        <option key={optionValue(opt)} value={optionValue(opt)} disabled={optionDisabled(opt)}>
          {optionLabel(opt)}
        </option>
      ))}
    </select>
  );
}
