import { Grid, IconPlus, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import styled from 'styled-components'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { Identity } from '../components/Identity'
import { NFTCard } from '../components/NFTCard'
import { PageHeader } from '../components/PageHeader'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { VisibilityChecker } from '../components/VisibilityChecker'
import { useWeb3 } from '../components/Web3Provider'
import { collectionMetadataSchema } from '../schemas'
import { useCollection } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { useNFTs } from '../utils/useNFTs'
import { isSameAddress } from '../utils/web3'

export const CollectionPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Collection />
    </PageWithSideBar>
  )
}

const COUNT_PER_PAGE = 16

const TwoColumnSpan = styled.div`
  grid-column: span 2;
`

const Collection: React.FC = () => {
  const {
    params: { cid: collectionId },
  } = useRouteMatch<{ cid: string }>()
  const { selectedAccount } = useWeb3()
  const collection = useCollection(collectionId)
  const { data: metadata } = useMetadata(collection?.metadataUri, collectionMetadataSchema)
  const { data: nfts } = useNFTs(collectionId)
  const [shownCount, setShownCount] = React.useState(COUNT_PER_PAGE)
  const centrifuge = useCentrifuge()

  const isLoanCollection = collection?.admin ? centrifuge.utils.isLoanPalletAccount(collection.admin) : true
  const canMint = !isLoanCollection && isSameAddress(selectedAccount?.address, collection?.owner)

  return (
    <Stack gap={8} flex={1}>
      <PageHeader
        parent={{ to: '/nfts', label: 'NFTs' }}
        title={metadata?.name || 'Unnamed collection'}
        subtitle={
          collection?.owner && (
            <>
              by <Identity address={collection?.owner} clickToCopy />
            </>
          )
        }
        actions={
          canMint && (
            <RouterLinkButton to={`/collection/${collectionId}/object/mint`} variant="outlined" icon={IconPlus} small>
              Mint NFT
            </RouterLinkButton>
          )
        }
      />

      <Grid gap={[2, 3]} columns={[2, 3, 4, 5]} equalColumns>
        {metadata?.description?.trim() && (
          <TwoColumnSpan>
            <Text variant="body1">{metadata?.description}</Text>
          </TwoColumnSpan>
        )}
        {!nfts?.length && (
          <TwoColumnSpan>
            <Text variant="label1">The collection does not contain any NFT</Text>
            <RouterLinkButton to={`/collection/${collectionId}/object/mint`} variant="text" icon={IconPlus}>
              Mint NFT
            </RouterLinkButton>
          </TwoColumnSpan>
        )}

        {nfts?.slice(0, shownCount).map((nft, i) => (
          <NFTCard nft={nft} key={i} />
        ))}
      </Grid>
      {(nfts?.length || 0) > shownCount && (
        <VisibilityChecker marginTop={400} onEnter={() => setShownCount((count) => count + COUNT_PER_PAGE)} />
      )}
    </Stack>
  )
}
