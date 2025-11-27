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
	gap: 8px;
	border-bottom: 1px solid #ccc;
`;

const TabButton = styled.button`
	padding: 8px 16px;
	background: ${props => (props.$active ? "#007bff" : "transparent")};
	color: ${props => (props.$active ? "white" : "#333")};
	border: none;
	border-radius: 6px 6px 0 0;
	cursor: pointer;
	font-weight: 600;

	&:hover {
		background: ${props => (props.$active ? "#0069d9" : "#f0f0f0")};
	}
`;

const TabContentContainer = styled.div`
	padding: 16px;
	border: 1px solid #ccc;
	border-top: none;
	border-radius: 0 0 6px 6px;
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
