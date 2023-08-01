import { client } from './client'
import { gql } from '@apollo/client'

const GET_DIAMOND_NFTS = `
    query DiamondNFTs {
        tokens {
        id
        uri
      }
    }
`
export async function getNFTs() {
    try {
        return await client
            .query({
                query: gql(GET_DIAMOND_NFTS),
                variables: {},
            })
    } catch (error) {
        console.log(error)
    }
}
