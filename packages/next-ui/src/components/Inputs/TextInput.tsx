'use client'

import { PRIMARY, PRIMARY_BORDER, SECONDARY_1, SECONDARY_1_SHADOW, SECONDARY_2, SECONDARY_2_SHADOW } from '../../styles';

import styled from 'styled-components';

const Container = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  /* align-items: flex-start; */
  width: 100%;
  padding: 0.25rem;
`;

const StyledInput = styled.input`
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  border: 1px solid ${PRIMARY};
  border-radius: 8px;
`;


const TextInput = ({ input, setInput }: { input: string, setInput: React.ComponentState }) => {
    return (
        <Container>
            <StyledInput value={input} onChange={(e) => setInput(e.target.value)} />
        </Container>
    );
};


export default TextInput;
