// SelectMultiple.jsx
import React from "react";
import Select from "react-select";

export default function SelectMultiple({
										   options = [],
										   value = [],
										   onChange = () => {},
										   placeholder = "Select...",
										   isClearable = true,
										   styles = {},
										   closeMenuOnSelect = false,
										   ...props
									   }) {
	// Convert array of strings to react-select format
	const selectOptions = options.map((o) =>
		typeof o === "string" ? { value: o, label: o } : o
	);

	const selectedValues = value.map((v) =>
		typeof v === "string" ? { value: v, label: v } : v
	);

	return (
		<Select
			options={selectOptions}
			value={selectedValues}
			onChange={(selected) => onChange(selected ? selected.map((s) => s.value) : [])}
			placeholder={placeholder}
			isMulti
			isClearable={isClearable}
			closeMenuOnSelect={closeMenuOnSelect}
			styles={{
				...styles,
			}}
			{...props}
		/>
	);
}
