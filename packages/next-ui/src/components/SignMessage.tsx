'use client'

import { useEffect, useState } from 'react'
import { recoverMessageAddress } from 'viem'
import { type Address, useSignMessage } from 'wagmi'
import TextInput from './Inputs/TextInput'
import BaseButton from './Buttons/BaseButton'

export function SignMessage() {
  const [recoveredAddress, setRecoveredAddress] = useState<Address>()
  const {
    data: signature,
    variables,
    error,
    isLoading,
    signMessage,
  } = useSignMessage()

  useEffect(() => {
    ; (async () => {
      if (variables?.message && signature) {
        const recoveredAddress = await recoverMessageAddress({
          message: variables?.message,
          signature,
        })
        setRecoveredAddress(recoveredAddress)
      }
    })()
  }, [signature, variables?.message])

  const [message, setMessage] = useState<string>("")

  return (
    <>
      <h2>Sign Message</h2>

      <TextInput input={message} setInput={setMessage}></TextInput>
      <BaseButton buttonText={"SIGN MESSAGE"} handleClick={() => signMessage({ message })} isLoading={isLoading}></BaseButton>

      {signature && (
        <div>
          <pre>Signature: {signature}</pre>
          <pre>Recovered address: {recoveredAddress}</pre>
        </div>
      )}
      {error && <div>Error: {error?.message}</div>}
    </>
  )
}
