'use client'

import { useEffect, useState } from 'react'

// import Image from 'next/image'
import { getNFTs } from '../utils/graph'
import styled from 'styled-components'
import { useAccount } from 'wagmi'

const InventoryItemContainer = styled.div`
    display: inline-block;
    margin: 10px;
    border: 1px solid black;
    border-bottom: 5px solid black;
    padding: 10px;
    border-radius: 10px;
    img {
        width: 50px;
        height: 50px;
        display: block;
    }
`

export function NFTInventory() {
    const [diamondsList, setDiamondsList] = useState<any>()
    const { address } = useAccount()

    useEffect(() => {
        getNFTs(address?.toLocaleLowerCase() as `0x${string}`).then((diamonds) => {
            setDiamondsList(diamonds?.data.tokens)
            console.log(diamonds?.data.tokens)
        })
    }, [])

    return (
        <>
            <h2>Diamond Inventory</h2>

            {/* Render each diamond in diamondList */}
            {diamondsList?.map((diamond: any) => {
                return (
                    <InventoryItemContainer key={diamond.id} >
                        <img src={diamond.uri} alt="diamond" />
                    </InventoryItemContainer>
                )
            }
            )}
            <pre></pre>
        </>
    )
}
