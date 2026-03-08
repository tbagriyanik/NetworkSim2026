'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-xl lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.aboutTitle}</DialogTitle>
          <DialogDescription>
            {t.aboutIntro}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full rounded-md border p-4">
          <h4 className="mb-4 text-lg font-bold">{t.termsAndConditions}</h4>
          <p className="text-sm">
            {t.termsText}
          </p>
          <p className="mt-4 text-sm font-semibold">
            {t.licenseInfo}
          </p>
        </ScrollArea>
        <div className="flex justify-end">
          <Button onClick={onClose}>{t.close}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
