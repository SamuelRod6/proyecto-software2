import React, { useState } from "react";
import Select, { MultiValue, SingleValue, StylesConfig } from "react-select";

export interface OptionType {
    value: string;
    label: string;
}

interface SelectInputProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: OptionType[];
  placeholder?: string;
  inputLabel?: string;
  className?: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
  isMulti?: boolean;
  isClearable?: boolean;
  menuPortalTarget?: HTMLElement | null;
}

const SelectInput: React.FC<SelectInputProps> = ({
  value,
  onChange,
  options,
  placeholder = "Selecciona una opción...",
  inputLabel,
  className = "",
  allowCustom = false,
  customPlaceholder = "Escribe...",
  isMulti = false,
  isClearable = false,
  menuPortalTarget,
}) => {
  const [customValue, setCustomValue] = useState("");
  const isOther = allowCustom && !isMulti && value === "otro";

  const handleSelect = (
    option: SingleValue<OptionType> | MultiValue<OptionType>,
  ) => {
    if (!option) {
      onChange(isMulti ? [] : "");
      setCustomValue("");
      return;
    }
    if (isMulti) {
      const values = (option as MultiValue<OptionType>).map((opt) => opt.value);
      onChange(values);
      return;
    }

    const selected = option as SingleValue<OptionType>;
    if (selected) {
      onChange(selected.value);
      if (selected.value !== "otro") setCustomValue("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value);
    onChange(e.target.value);
  };

  const finalOptions =
    allowCustom && !isMulti
      ? [...options, { value: "otro", label: "Otro..." }]
      : options;

  const resolvedMenuPortalTarget =
    menuPortalTarget ??
    (typeof document === "undefined" ? null : document.body);

  const selectedValue = isMulti
    ? finalOptions.filter(
        (opt) => Array.isArray(value) && value.includes(opt.value),
      )
    : finalOptions.find((opt) => opt.value === value) || null;

  return (
    <div className={className}>
      {inputLabel && (
        <label className="block mb-1 text-slate-300 font-medium">
          {inputLabel}
        </label>
      )}
      <Select
        options={finalOptions}
        value={selectedValue}
        onChange={handleSelect}
        placeholder={placeholder}
        classNamePrefix="react-select"
        isSearchable
        isMulti={isMulti}
        isClearable={isClearable}
        closeMenuOnSelect={!isMulti}
        menuPortalTarget={resolvedMenuPortalTarget}
        menuPosition={resolvedMenuPortalTarget ? "fixed" : "absolute"}
        styles={customStyles}
      />
      {isOther && (
        <input
          type="text"
          className="mt-2 w-full rounded border border-slate-600 bg-slate-800 text-slate-200 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-[0.95rem] placeholder:text-slate-500"
          placeholder={customPlaceholder}
          value={customValue}
          onChange={handleInputChange}
        />
      )}
    </div>
  );
};

const customStyles: StylesConfig<OptionType, boolean> = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "#1e293b",
    borderColor: "#334155",
    color: "#e2e8f0",
    fontSize: "0.85rem",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#e2e8f0",
    fontSize: "0.85rem",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    fontSize: "0.85rem",
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: getOptionBackground(state.isSelected, state.isFocused),
    color: state.isSelected ? "#1e293b" : "#e2e8f0",
    fontSize: "0.85rem",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#94a3b8",
    fontSize: ".85rem",
  }),
  input: (provided) => ({
    ...provided,
    color: "#e2e8f0",
    fontSize: "0.85rem",
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#334155",
    border: "1px solid #475569",
    borderRadius: "0.5rem",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#e2e8f0",
    fontSize: "0.8rem",
    paddingLeft: "0.5rem",
    paddingRight: "0.35rem",
  }),
  multiValueRemove: (provided, state) => ({
    ...provided,
    color: "#facc15",
    backgroundColor: state.isFocused ? "#475569" : "transparent",
    borderRadius: "0 0.5rem 0.5rem 0",
    paddingLeft: "0.35rem",
    paddingRight: "0.45rem",
    ":hover": {
      backgroundColor: "#64748b",
      color: "#fff",
      cursor: "pointer",
    },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: "#facc15",
    ":hover": { color: "#fde047" },
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: "#94a3b8",
    ":hover": { color: "#e2e8f0" },
  }),
};

function getOptionBackground(isSelected: boolean, isFocused: boolean): string {
  if (isSelected) return "#facc15";
  if (isFocused) return "#334155";
  return "#1e293b";
}

export default SelectInput;
