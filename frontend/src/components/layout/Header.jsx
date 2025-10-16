import React from "react";
import styled from "styled-components";

export default function PageHeader({ title, icon, actions }) {
    return (
        <Header>
            <Left>
                {icon ? <span>{icon}</span> : null}
                <h1>{title}</h1>
            </Left>
            <Right>
                {Array.isArray(actions) ? actions.map((a, i) => <span key={i}>{a}</span>) : actions}
            </Right>
        </Header>
    );
}

const Header = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    gap: 1rem;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
    background-color: var(--color-background);
`;

const Left = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    h1 {
        margin: 0; 
        font-size: 1.25rem;
    }
`;

const Right = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;