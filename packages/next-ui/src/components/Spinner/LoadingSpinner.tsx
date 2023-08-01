import styled, { keyframes } from 'styled-components';

// Define the spinning animation
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Define a Spinner styled component
const Spinner = styled.div`
    /* display: relative; */
    width: 1rem;
    height: 1rem;
    /* height: 100%; */
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #FFF;
    animation: ${spin} 1s ease-in-out infinite;
    box-sizing: border-box; // ensure that the border width doesn't cause the element to exceed 100%
`;

const SpinnerContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    /* width: 100%; */
    /* aspect-ratio: 1; */
`;

const LoadingSpinner = () => {
    return (
        <SpinnerContainer>
            <Spinner />
        </SpinnerContainer>
    );
}

export default LoadingSpinner;