'use client'

import { useContractWrite, useWaitForTransaction } from 'wagmi'

import BaseButton from './Buttons/BaseButton'
import { BaseError } from 'viem'
import { stringify } from '../utils/stringify'
import { useDiamondsMint } from '../generated'
import { wagmiContractConfig } from './contracts'

export function MintNFT() {
    const { write, data, error, isLoading, isError } = useDiamondsMint();
    const {
        data: receipt,
        isLoading: isPending,
        isSuccess,
    } = useWaitForTransaction({ hash: data?.hash })

    return (
        <>
            <h2>Mint a diamond</h2>
            <BaseButton buttonText={"MINT DIAMOND"} handleClick={() => write({ args: [BigInt(1)] })} isLoading={isLoading}></BaseButton>

            {isSuccess && (
                <>
                    <pre>Transaction Hash: {data?.hash}</pre>
                    <pre>
                        Transaction Receipt: <pre>{stringify(receipt, null, 2)}</pre>
                    </pre>
                </>
            )}
            {isError && <pre style={{ color: "red" }}>{(error as BaseError)?.shortMessage}</pre>}
        </>
    )
}
