'use client'

import { PRIMARY, PRIMARY_BORDER, SECONDARY_1, SECONDARY_2 } from '../../styles';

import { LoadingSpinner } from '../Spinner';
import styled from 'styled-components';
import { useState } from 'react';

const Button = styled.button<{ $isActive?: boolean, $isLoading?: boolean }>`
  outline-offset: 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 16px;
  gap: 8px;
  height: 40px;
  width: 100%;
  background: ${props => props.$isActive ? SECONDARY_1 : PRIMARY_BORDER};
  border: 0px;
  border-bottom: ${props => props.$isActive ? '0px' : '4px solid ' + PRIMARY};
  border-radius: 10px;
  transition: background 0.3s ease-in-out, transform 0.3s ease-in-out;
  cursor: pointer;

  &:hover {
    background: ${SECONDARY_2};
    border: 0px;
    border-bottom: ${props => props.$isActive ? '0px' : '4px solid ' + PRIMARY};
    border-radius: 10px;
  }

`;

const ButtonText = styled.span`
  font-weight: 600;
  font-size: 14px;
  line-height: 21px;
  display: flex;
  align-items: center;
  text-align: center;
  color: ${SECONDARY_1};
  flex: none;
  order: 0;
  flex-grow: 0;
`;


interface ButtonComponentProps {
    isLoading?: boolean;
    handleClick?: () => void;
    buttonText?: string;
}

const BaseButton: React.FC<ButtonComponentProps> = ({ handleClick = () => console.log("Unassigned Button"), buttonText = "INSERT_TEXT", isLoading }) => {
    const [isActive, setIsActive] = useState<boolean>(false);

    const handleButtonDown = () => {
        setIsActive(true);
    };

    const handleButtonUp = () => {
        setIsActive(false);
        handleClick();
    };

    return (
        <div style={{ padding: "0.25rem" }}>
            <Button onMouseDown={handleButtonDown} onMouseUp={handleButtonUp} $isActive={isActive} $isLoading={isLoading}>
                {isLoading ? <LoadingSpinner /> : <ButtonText>{buttonText}</ButtonText>}

            </Button>
        </div>
    );

};

export default BaseButton;
