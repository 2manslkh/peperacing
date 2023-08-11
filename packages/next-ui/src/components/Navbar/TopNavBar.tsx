'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit';
import styled from 'styled-components';
import useWindowDimensions from '../../hooks/useWindowDimensions';

const Nav = styled.nav`
  background: #333;
  width: 100%;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  top: 0px;
  margin: 0px;
  z-index: 100;
  padding: 0 1rem;
  box-sizing: border-box;
`;
const NavContainer = styled.nav`
  background: #333;
  width: 100%;
  padding: 0 1em;

`;

const Logo = styled.h1`
  color: #fff;
  cursor: pointer;
`;

const NavItems = styled.div`
  display: flex;
`;

const NavItem = styled.a`
  color: #fff;
  text-decoration: none;
  margin: 0 1em;
  
  &:hover {
    color: #ddd;
  }
`;

const TopNavBar = () => {

    const { windowDimensions } = useWindowDimensions();
    return (
        <Nav>
            <Logo>Wagmi Boilerplate</Logo>
            {windowDimensions.width > 768 &&
                <NavItems>
                    <NavItem href="/">Home</NavItem>
                    <NavItem href="/demo">Demo</NavItem>
                </NavItems>
            }
            <ConnectButton />
        </Nav>
    )
}


export default TopNavBar;
