import React, { useState, Children, cloneElement } from "react";
import styled from "styled-components";

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
	background-color: var(--color-background-surface-3);
	padding: var(--spacing-xs);
	border-radius: var(--border-radius-xs);
	margin-bottom: var(--spacing-s);
`;

const TabButton = styled.div`
	padding: var(--spacing-xs) var(--spacing-s);
	background: ${props => (props.$active ? "var(--color-primary-bg)" : "transparent")};
	color: ${props => (props.$active ? "var(--color-primary-text)" : "var(--color-text)")};
	border: none;
	border-radius: var(--border-radius-2xs);
    line-height: var(--font-size-2xl);
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

export const TabsTrigger = ({ value, children, activeTab, setActiveTab }) => {
	const isActive = activeTab === value;
	return (
		<TabButton $active={isActive} onClick={() => setActiveTab(value)}>
			{children}
		</TabButton>
	);
};

export const TabsContent = ({ value, children, activeTab }) => {
	if (activeTab !== value) return null;
	return <TabContentContainer>{children}</TabContentContainer>;
};
