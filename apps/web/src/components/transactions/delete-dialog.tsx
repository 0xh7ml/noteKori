'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDeleteTransaction } from '@/hooks/use-transactions'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  transactionId: string
  transactionTitle: string
}

export function DeleteDialog({ open, onOpenChange, transactionId, transactionTitle }: Props) {
  const deleteTx = useDeleteTransaction()

  const handleDelete = async () => {
    try {
      await deleteTx.mutateAsync(transactionId)
      toast.success('Transaction deleted')
      onOpenChange(false)
    } catch {
      toast.error('Failed to delete transaction')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete transaction?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{transactionTitle}</span> will be permanently deleted. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteTx.isPending}
          >
            {deleteTx.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
