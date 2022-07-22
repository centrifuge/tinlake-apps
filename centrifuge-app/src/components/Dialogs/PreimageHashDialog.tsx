import { Box, Dialog, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { copyToClipboard } from '../../utils/copyToClipboard'

export const PreimageHashDialog: React.FC<{
  hash: string
  open: boolean
  onClose: () => void
}> = ({ hash, open, onClose }) => {
  return (
    <Dialog isOpen={open} onClose={onClose} width="684px">
      <Box display="flex">
        <Stack gap="3">
          <Text variant="heading2">Preimage hash</Text>
          <Box alignSelf="flex-end">
            <Text
              style={{
                cursor: 'copy',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
              }}
              onClick={() => copyToClipboard(hash)}
            >
              {hash}
            </Text>
          </Box>
        </Stack>
      </Box>
    </Dialog>
  )
}
