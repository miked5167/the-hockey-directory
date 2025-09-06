'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ContactAdvisorForm } from './contact-advisor-form'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  advisorId: string
  advisorName: string
}

export function ContactModal({ isOpen, onClose, advisorId, advisorName }: ContactModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <ContactAdvisorForm 
          advisorId={advisorId}
          advisorName={advisorName}
          onSuccess={onClose}
          onClose={onClose}
          className="border-0 shadow-none"
        />
      </DialogContent>
    </Dialog>
  )
}