import { PoolMetadata } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'
import { PaddingProps } from 'styled-system'
import { useCentrifuge } from './CentrifugeProvider'
import { ExecutiveSummaryDialog } from './Dialogs/ExecutiveSummaryDialog'
import { AnchorPillButton } from './PillButton'

type IssuerSectionProps = {
  metadata: Partial<PoolMetadata> | undefined
} & PaddingProps

export const IssuerSection: React.VFC<IssuerSectionProps> = ({ metadata, ...props }) => {
  const cent = useCentrifuge()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  return (
    <Stack {...props}>
      <Box>
        {metadata?.pool?.issuer.logo && (
          <StyledImage
            src={cent.metadata.parseMetadataUrl(metadata?.pool?.issuer.logo?.uri ?? metadata?.pool?.issuer.logo)}
          />
        )}
      </Box>
      <Shelf alignItems="flex-start" gap="3">
        <Text variant="body2">{metadata?.pool?.issuer.description}</Text>
        <Stack gap="2">
          <Stack>
            <Text variant="label2">Issuer</Text>
            <Text variant="body2">{metadata?.pool?.issuer.name}</Text>
          </Stack>
          <Stack gap="4px">
            {metadata?.pool?.links.executiveSummary && (
              <Shelf>
                <AnchorPillButton variant="small" onClick={() => setIsDialogOpen(true)}>
                  Executive summary
                </AnchorPillButton>
                <ExecutiveSummaryDialog
                  href={cent.metadata.parseMetadataUrl(
                    metadata?.pool?.links.executiveSummary.uri ?? metadata?.pool?.links.executiveSummary
                  )}
                  open={isDialogOpen}
                  onClose={() => setIsDialogOpen(false)}
                />
              </Shelf>
            )}
            {metadata?.pool?.links.website && (
              <Shelf>
                <AnchorPillButton variant="small" href={metadata?.pool?.links.website}>
                  Website
                </AnchorPillButton>
              </Shelf>
            )}
            {metadata?.pool?.links.forum && (
              <Shelf>
                <AnchorPillButton variant="small" href={metadata?.pool?.links.forum}>
                  Forum
                </AnchorPillButton>
              </Shelf>
            )}
            {metadata?.pool?.issuer.email && (
              <Shelf>
                <AnchorPillButton variant="small" href={`mailto:${metadata?.pool?.issuer.email}`}>
                  Email
                </AnchorPillButton>
              </Shelf>
            )}
          </Stack>
        </Stack>
      </Shelf>
    </Stack>
  )
}

const StyledImage = styled.img`
  min-height: 104px;
  min-width: 100px;
  max-height: 104px;
  margin-bottom: 16px;
`
