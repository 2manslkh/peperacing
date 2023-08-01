'use client'

import styled from 'styled-components';

const Container = styled.div<{ width?: string }>`
  max-width: ${props => props.width}px;
  width: 100%;
  margin: 0 auto;    // center the container
  justify-self: center;
`;


const MaxWidthContainer = ({ children,
}: {
    children: React.ReactNode
}) => (
    <Container width='1440'>
        {children}
    </Container >
);

export default MaxWidthContainer;
