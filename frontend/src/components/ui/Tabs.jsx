import React, {useState, Children, cloneElement, useEffect} from "react";
import styled, {css} from "styled-components";

// --- Styled ---
const TabsContainer = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
`;

const TabsListContainer = styled.div`
	display: flex;
	width: fit-content;
	max-width: 100%;
    border: 1px solid var(--color-background-surface-3);
    background-color: var(--color-background-surface-3);
	padding: var(--spacing-xs);
	border-radius: var(--border-radius-xs);
	margin-bottom: var(--spacing-s);
`;

const TabButton = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: calc(var(--spacing-s) - var(--spacing-2xs));
    font-size: var(--font-size);
	background: ${props => (props.$active ? "var(--color-primary-bg)" : "transparent")};
	color: ${props => (props.$active ? "var(--color-primary-text)" : "var(--color-text)")};
	border: none;
	border-radius: var(--border-radius-2xs);
	transition: all .2s ease-in-out;
	cursor: pointer;
`;

const TabContentContainer = styled.div`
`;


// --- Recursive prop drilling ---
const cloneChildrenWithProps = (children, props) =>
	Children.map(children, child => {
		if (!React.isValidElement(child)) return child;
		return cloneElement(
			child,
			props,
			child.props.children
				? cloneChildrenWithProps(child.props.children, props)
				: child.props.children
		);
	});

// --- Tabs Components ---
export const Tabs = ({ defaultValue, children }) => {
	const [activeTab, setActiveTab] = useState(defaultValue);
	const childrenWithProps = cloneChildrenWithProps(children, { activeTab, setActiveTab });
	return <TabsContainer>{childrenWithProps}</TabsContainer>;
};

export const TabsList = ({ children }) => <TabsListContainer>{children}</TabsListContainer>;

export const TabsTrigger = ({ value, children, activeTab, setActiveTab, ...props }) => {
	const isActive = activeTab === value;
	return (
		<TabButton $active={isActive} onClick={() => setActiveTab(value)} {...props}>
			{children}
		</TabButton>
	);
};

export const TabsContent = ({ value, activeTab, children }) => {
	const isActive = activeTab === value;
	const [shouldRender, setShouldRender] = useState(isActive);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (isActive) {
			setShouldRender(true);
			setVisible(false);

			// 🚀 TWO animation frames to guarantee proper fade-in
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setVisible(true);
				});
			});

		} else {
			setVisible(false);
			setShouldRender(false);
		}
	}, [isActive]);

	if (!shouldRender) return null;

	return (
		<FadeInWrapper $visible={visible}>
			{children}
		</FadeInWrapper>
	);
};

const FadeInWrapper = styled.div`
    opacity: ${props => (props.$visible ? 1 : 0)};
    transition: opacity 0.5s ease;
`;
