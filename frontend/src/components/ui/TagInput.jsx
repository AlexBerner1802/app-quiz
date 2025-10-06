import React, {useState, useRef, useEffect, useCallback} from "react";
import styled from "styled-components";

const TagInput = ({
	label,
	suggestions = [],
	value = [],            // array of { id, tag_name }
	onChange,
	placeholder = "Ajouter un tag...",
	prefixAdd = "Ajouter ",
	allowNew = true,
	width = "fit-content",
	height="fit-content",
	wrapperStyle,
	labelStyle,
	inputStyle,
	wrapperClassName,
	labelClassName,
	inputClassName,
	apiUrl = (import.meta?.env?.VITE_API_URL || "http://127.0.0.1:8000"),
	fetchFromApi = true,
	dedupeCaseInsensitive = true,
}) => {
	const [inputValue, setInputValue] = useState("");
	const [filteredSuggestions, setFilteredSuggestions] = useState([]);
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState(null);
	const containerRef = useRef(null);
	const debounceRef = useRef(0);

	const normalize = (s) => (s || "").trim().toLowerCase();

	const notAlreadySelected = useCallback(
		(s) => s && s.tag_name && !value.find((t) => t?.id === s.id),
		[value]
	);

	const localFilter = useCallback((val, pool) => {
		const filtered = (pool || []).filter(notAlreadySelected);
		const matches = val
		? filtered.filter((s) => s.tag_name.toLowerCase().includes(val.toLowerCase()))
		: filtered;
		setFilteredSuggestions(matches);
	}, [notAlreadySelected]);

	// Fetch from the API when we type (with a little debounce)
	const remoteFetch = useCallback((val) => {
		window.clearTimeout(debounceRef.current);
		debounceRef.current = window.setTimeout(async () => {
		if (!fetchFromApi) {
			// fallback local
			return localFilter(val, suggestions);
		}
		setLoading(true); setErr(null);
		try {
			const qs = val ? `?search=${encodeURIComponent(val)}` : "";
			const res = await fetch(`${apiUrl}/api/tags${qs}`, {
			method: "GET",
			headers: { Accept: "application/json" },
			credentials: "omit",
			});
			const data = await res.json().catch(() => ([]));
			if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
			// Assure an objects table {id, tag_name}
			const safe = Array.isArray(data) ? data : [];
			localFilter(val, safe);
		} catch (e) {
			console.error(e);
			setErr(e.message || "Erreur de chargement des tags");
			// In error case, filter at least on local suggestions if available
			localFilter(val, suggestions);
		} finally {
			setLoading(false);
		}
		}, 200);
	}, [apiUrl, fetchFromApi, localFilter, suggestions]);

	// Update the list at each character writed
	useEffect(() => {
		remoteFetch(inputValue);
		return () => window.clearTimeout(debounceRef.current);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [inputValue, fetchFromApi, apiUrl]);

	// Close dropdown if clicked outside
	useEffect(() => {
		const handleClickOutside = (event) => {
		if (containerRef.current && !containerRef.current.contains(event.target)) {
			setIsOpen(false);
		}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const addTag = (tag) => {
		if (!tag) return;
		const exists = value.find((t) => t?.id === tag.id);
		if (!exists) {
		onChange?.([...value, tag]);
		}
		setInputValue("");
		setIsOpen(false);
	};

	const removeTag = (tag) => {
		onChange?.(value.filter((t) => t?.id !== tag.id));
	};

	const tryFindExistingLocally = useCallback((name) => {
		const n = normalize(name);
		const pool = [...filteredSuggestions, ...value, ...suggestions];
		return pool.find((s) => dedupeCaseInsensitive
		? normalize(s?.tag_name) === n
		: s?.tag_name === name
		);
	}, [filteredSuggestions, suggestions, value, dedupeCaseInsensitive]);

	const createRemoteTag = useCallback(async (name) => {
		// Client-side security: if already existing (ignoring case), we reuse it
		const local = tryFindExistingLocally(name);
		if (local) return local;

		try {
		const res = await fetch(`${apiUrl}/api/tags`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			credentials: "omit",
			body: JSON.stringify({ tag_name: name.trim() }),
		});
		const data = await res.json().catch(() => ({}));
		if (res.status === 409) {
			// Server-side duplicate -> try to get it back from search
			const searchRes = await fetch(`${apiUrl}/api/tags?search=${encodeURIComponent(name)}`, {
			headers: { Accept: "application/json" },
			});
			const arr = await searchRes.json().catch(() => ([]));
			if (Array.isArray(arr) && arr.length) {
			// Find the exact match (case insensitive)
			const exact = arr.find(t => normalize(t.tag_name) === normalize(name)) || arr[0];
			return exact;
			}
			throw new Error("Tag déjà existant.");
		}
		if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
		// Data shall looks like { id, tag_name }
		if (!data?.id || !data?.tag_name) throw new Error("Réponse inattendue de l'API tags.");
		return data;
		} catch (e) {
		console.error(e);
		throw e;
		}
	}, [apiUrl, tryFindExistingLocally]);

	const onValidateInput = async () => {
		const raw = inputValue.trim();
		if (!raw) return;
		// 1) If already in suggestions we take
		const existing = filteredSuggestions.find(
		(s) => s?.tag_name?.toLowerCase() === raw.toLowerCase()
		);
		if (existing) { addTag(existing); return; }

		// 2) If allowNew, we try to create in DB then we add
		if (allowNew) {
		try {
			const created = fetchFromApi ? await createRemoteTag(raw) : { id: `new-${Date.now()}`, tag_name: raw };
			addTag(created);
		} catch (e) {
			alert(e.message || "Impossible de créer ce tag");
		}
		}
	};

	return (
		<Wrapper
			style={wrapperStyle}
			className={wrapperClassName}
			width={width}
			ref={containerRef}
		>
			{label && (
				<Label style={labelStyle} className={labelClassName}>
					{label}
				</Label>
			)}

			<TagContainer height={height}>
				{value.map((tag) => (
					tag && tag.tag_name && (
						<Tag key={tag.id}>
							{tag.tag_name}
							<RemoveButton onClick={() => removeTag(tag)}>×</RemoveButton>
						</Tag>
					)
				))}

				<StyledInput
					value={inputValue}
					onFocus={() => {
						if (inputValue.length > 0) setIsOpen(true);
					}}
					onChange={(e) => {
						const val = e.target.value;  // <-- define val
						setInputValue(val);
						setIsOpen(true);
					}}
					onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === "Tab") {
					e.preventDefault();
					onValidateInput();
					}
					if (e.key === "ArrowDown") setIsOpen(true);
				}}
				placeholder={placeholder}
				style={inputStyle}
				className={inputClassName}
				aria-invalid={!!err}
				/>
			</TagContainer>

			{isOpen && (
				<Dropdown>
					{loading && <DropdownItem>Chargement…</DropdownItem>}
					{err && !loading && <DropdownItem>{err}</DropdownItem>}
					{!loading && filteredSuggestions.map(
						(s) =>
							s && (
								<DropdownItem key={s.id} onClick={() => addTag(s)}>
								{s.tag_name}
								</DropdownItem>
							)
					)}
					{allowNew &&
						inputValue &&
						!filteredSuggestions.find((s) => s?.tag_name?.toLowerCase() === inputValue.trim().toLowerCase()) && (
							<DropdownItem key={`new-${inputValue}`} onClick={onValidateInput}>
								{prefixAdd} "{inputValue}"
							</DropdownItem>
						)}
					</Dropdown>
				)}
		</Wrapper>
	);
};

export default TagInput;

/* ---------------- styled components ---------------- */

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
	width: ${({ width }) => width};
`;

const Label = styled.label`
	font-size: var(--font-size);
	font-weight: 500;
	margin-bottom: var(--spacing-xs, 0.25rem);
	color: var(--color-text, #333);
`;

const TagContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	gap: var(--spacing-xs, 0.25rem);
	border: 2px solid var(--color-border, #ccc);
	border-radius: var(--border-radius);
	padding: var(--spacing-xs, 0.25rem);
	background: var(--color-background-input, #fff);
	min-height: 50px;
	height: ${({ height }) => height};
	&:focus-within { border-color: var(--color-primary-bg, #2684ff); }
`;

const Tag = styled.div`
	display: flex;
	align-items: center;
	background: var(--color-primary-bg, #2684ff);
	color: var(--color-text, #333);
	border-radius: var(--border-radius);
	padding: var(--spacing-xs) var(--spacing-s);
	font-size: var(--font-size-s);
`;

const RemoveButton = styled.div`
	background: none;
	border: none;
	margin-left: var(--spacing-xs);
	color: var(--color-text, #333);
	font-size: var(--font-size);
	cursor: pointer;
	width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--border-radius-full);
	&:hover { background: var(--color-primary-bg-hover, #2684ff); }
`;

const StyledInput = styled.input`
	border: none;
	outline: none;
	flex: 1;
	min-width: 120px;
	padding: 0.25rem;
	font-size: 0.875rem;
	background: transparent;
	height: 34px;
`;

const Dropdown = styled.ul`
	position: absolute;
	top: 100%;
	left: 0; right: 0;
	margin: 0.25rem 0 0;
	padding: 0;
	list-style: none;
	background: var(--color-background-input, #fff);
	border: 1px solid var(--color-border, #ccc);
	border-radius: var(--border-radius);
	max-height: 150px;
	overflow-y: auto;
	box-shadow: var(--box-shadow);
	transition: max-height 0.3s ease, opacity 0.3s ease, transform 0.25s ease-in-out;
	z-index: 1000;
`;

const DropdownItem = styled.li`
	height: 40px; line-height: 40px;
	padding: 0 var(--spacing-s, 0.25rem);
	cursor: pointer;
	&:hover { background: var(--color-primary-bg, #f0f0f0); }
`;
