"use client";

type Props = {
  value: string[];
  options: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

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
        <option key={opt} value={opt}>
          {opt || "(blank)"}
        </option>
      ))}
    </select>
  );
}