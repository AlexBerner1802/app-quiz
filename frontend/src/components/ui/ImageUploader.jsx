import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { Trash2, Edit3, Upload } from "lucide-react";


export default function ImageUploader({
										  value,
										  onChange,
										  placeholder = "Click or drag an image here",
										  width = "100%",
										  height = "240px",
										  style
									  }) {
	const inputRef = useRef(null);
	const [isHover, setIsHover] = useState(false);
	const [preview, setPreview] = useState("");

	useEffect(() => {
		if (!value) {
			setPreview("");
			return;
		}

		if (value instanceof File) {
			const url = URL.createObjectURL(value);
			setPreview(url);
			return () => URL.revokeObjectURL(url);
		}

		if (typeof value === "string") {
			setPreview(value);
		}
	}, [value]);

	const handleFiles = (files) => {
		const file = files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			alert("Please select an image file.");
			return;
		}
		onChange(file);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setIsHover(false);
		handleFiles(e.dataTransfer.files);
	};

	const openPicker = () => inputRef.current?.click();

	const clearImage = (e) => {
		e.stopPropagation();
		onChange(null);
	};

	return (
		<DropZone
			onClick={openPicker}
			onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
			onDragOver={(e) => { e.preventDefault(); setIsHover(true); }}
			onDragLeave={() => setIsHover(false)}
			onDrop={handleDrop}
			tabIndex={0}
			style={{ width, height, ...style }}
		>
			{preview ? (
				<PreviewContainer>
					<PreviewImage src={preview} alt="preview" />
					<Overlay $show={isHover}>
						<EditIcon size={20} />
						<OverlayText>Click to change image</OverlayText>
					</Overlay>
					<ClearButton onClick={clearImage}>
						<Trash2 size={16} />
					</ClearButton>
				</PreviewContainer>
			) : (
				<Placeholder>
					<Upload size={30} />
					<span>{placeholder}</span>
				</Placeholder>
			)}
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				style={{ display: "none" }}
				onChange={(e) => handleFiles(e.target.files)}
			/>
		</DropZone>
	);
}




const Placeholder = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--color-placeholder, #888);
    text-align: center;
    font-size: 14px;
	gap: var(--spacing);
	transition: all .2s ease;
`;

const DropZone = styled.div`
    border: 2px dashed var(--color-border, #ccc);
    border-radius: 12px;
    background-color: var(--quiz-surface-muted, #f9f9f9);
    cursor: pointer;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    transition: all .2s ease;

    &:hover {
        background-color: var(--color-primary-muted, #f9f9f9);
        border: 2px dashed var(--color-primary-bg, #ccc);

        ${Placeholder}{
            color: var(--color-primary-bg);
		}
    }
`;

const PreviewImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
`;

const Overlay = styled.div`
    position: absolute;
    inset: 0;
    background-color: rgba(0,0,0,0.5);
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--color-primary-text, #888);
	transition: all .2s ease;
	width: 100%;
	height: 100%;
    font-size: 14px;
    font-weight: 500;
    gap: 6px;
	z-index: 10;
`;

const PreviewContainer = styled.div`
    width: 100%;
    height: 100%;
    position: relative;

    &:hover {
        ${Overlay}{
            display: flex;
        }
    }
`;

const OverlayText = styled.span``;

const EditIcon = styled(Edit3)`
    color: #fff;
`;

const ClearButton = styled.button`
    position: absolute;
    top: 8px;
    right: 8px;
    border: none;
    background: var(--color-error-bg, #f87171);
    color: var(--color-error-text, #fff);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease;
	padding: 0;
    z-index: 12;

    &:hover {
        background: var(--color-error-bg-hover, #dc2626);
    }
`;
