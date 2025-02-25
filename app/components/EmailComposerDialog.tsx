'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmailComposer } from './EmailComposer';

interface EmailComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateType: 'mjml' | 'html';
  initialTemplate: string;
  emailData: any;
  onSave: (template: string) => void;
}

export const EmailComposerDialog: React.FC<EmailComposerDialogProps> = ({
  open,
  onOpenChange,
  templateType,
  initialTemplate,
  emailData,
  onSave,
}) => {
  const handleSave = (template: string) => {
    onSave(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {templateType === 'mjml' ? 'MJML' : 'HTML'} Email Composer
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <EmailComposer
            templateType={templateType}
            initialTemplate={initialTemplate}
            emailData={emailData}
            onSave={handleSave}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}; 