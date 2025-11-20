import React, {useId} from 'react';
import ReactDatePicker from 'react-datepicker';
import styled from 'styled-components';
import 'react-datepicker/dist/react-datepicker.css';

const DatePicker = ({
	                    label ,
	                    value,
	                    onChange,
	                    placeholder = 'dd.mm.yyyy',
	                    format = 'dd.MM.yyyy',
	                    width = 'fit-content',
	                    size = 'm',
	                    icon = null,
	                    minDate,
	                    maxDate,
	                    wrapperStyle,
	                    labelStyle,
	                    inputStyle,
	                    wrapperClassName,
	                    labelClassName,
	                    inputClassName,
	                    ...props
                    }) => {

	const id = useId();

	return (
		<Wrapper style={wrapperStyle} className={wrapperClassName} width={width}>
			{label && <Label htmlFor={id} style={labelStyle} className={labelClassName}>{label}</Label>}
			<InputWrapper $size={size}>
				{icon && <IconWrapper $size={size}>{icon}</IconWrapper>}
				<StyledDatePicker
					id={id}
					selected={value}
					onChange={onChange}
					placeholderText={placeholder}
					dateFormat={format}
					minDate={minDate ? new Date(minDate) : undefined}
					maxDate={maxDate ? new Date(maxDate) : undefined}
					style={inputStyle}
					className={inputClassName}
					autoComplete="off"
					$size={size}
					{...props}
				/>
			</InputWrapper>
		</Wrapper>
	);
};

export default DatePicker;


const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	width: ${({ width }) => width};
`;

const Label = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--color-text, #333);
	margin-bottom: var(--spacing-xs);
`;

const InputWrapper = styled.div`
	display: flex;
	width: 100%;
	align-items: center;
	border: 1px solid transparent;
	background-color: var(--color-input-background, #fff);
	color: var(--color-text);
	border-radius: ${({ $size }) =>
			$size === 's' ? '0.25rem' :
					$size === 'l' ? '0.5rem' : '0.375rem'};
	padding: 0;
	transition: all .2s ease-in-out;

	&:focus-within {
		border-color: var(--color-primary-bg, #2684FF);
	}
	
	.react-datepicker-wrapper {
		width: 100%;
		display: block;
	}

	.react-datepicker__input-container {
		width: 100%;
	}
`;

const IconWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	padding-left: 0.5rem;

	svg {
		width: ${({ $size }) =>
	$size === 's' ? '1rem' :
		$size === 'l' ? '1.5rem' : '1.25rem'};
		height: ${({ $size }) =>
	$size === 's' ? '1rem' :
		$size === 'l' ? '1.5rem' : '1.25rem'};
	}
`;

const StyledDatePicker = styled(ReactDatePicker)`
	border: none;
	background-color: var(--color-input-background, #fff);
	outline: none;
	width: 100%;
	line-height: var(--line-height);
	transition: all .2s ease-in-out;

	font-size: ${({ $size }) =>
			$size === 's' ? 'var(--font-size-s)' :
					$size === 'l' ? 'var(--font-size-l)' :
							'var(--font-size)'};

	padding: ${({ $size }) =>
			$size === 's' ? '0.5rem 0.625rem' :
					$size === 'l' ? '0.9375rem 1.875rem' : '0.75rem 1rem'};
	
	&::placeholder {
		color: var(--color-text-muted, #aaa);
	}
`;
