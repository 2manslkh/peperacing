'use client'

import { useEffect, useState } from 'react'

import { getNFTs } from '../utils/graph'
import styled from 'styled-components'

const InventoryItemContainer = styled.div`
    display: inline-block;
    margin: 10px;
    border: 1px solid black;
    padding: 10px;
    border-radius: 10px;
    img {
        width: 50px;
        height: 50px;
    }
`

export function NFTInventory() {

    const [diamondsList, setDiamondsList] = useState<any>()

    useEffect(() => {
        getNFTs().then((diamonds) => {
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
                        <img src={diamond.uri} />
                    </InventoryItemContainer>

                )
            }
            )}
            <pre></pre>
        </>
    )
}
