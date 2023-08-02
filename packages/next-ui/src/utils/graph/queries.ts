import { client } from './client'
import { gql } from '@apollo/client'

const GET_DIAMOND_NFTS = `
    query getNFTsByOwner($owner: String) {
        tokens (where: {owner: $owner}){
        id
        uri
        }
    }
`
export async function getNFTs(owner: `0x${string}`) {
    try {
        return await client
            .query({
                query: gql(GET_DIAMOND_NFTS),
                variables: { owner: owner },
            })
    } catch (error) {
        console.log(error)
    }
}
