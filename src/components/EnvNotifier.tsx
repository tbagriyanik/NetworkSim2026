'use client';

import { useEffect } from 'react';
import { checkEnvStatus } from '@/app/actions/envCheck';
import { useToast } from '@/hooks/use-toast';

export function EnvNotifier() {
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    async function verifyEnv() {
      try {
        const status = await checkEnvStatus();
        if (!mounted) return;

        if (!status.hasEnv) {
          toast({
            variant: 'destructive',
            title: 'Çevre Değişkenleri Eksik (.env)',
            description: '.env dosyası veya temel çevre değişkenleri tanımlı değil.',
          });
          return;
        }

        const missingParts: string[] = [];
        if (!status.hasSheetsKey) {
          missingParts.push('Google Sheets Key (GOOGLE_SHEETS_CONTACT_URL)');
        }
        if (!status.hasKvKeys) {
          missingParts.push('KV Anahtarları (KV_REST_API_URL / KV_REST_API_TOKEN)');
        }
        if (!status.hasCertSecret) {
          missingParts.push('Sertifika Gizli Anahtarı (CERTIFICATE_SECRET)');
        }
        if (!status.hasExamHmacKey) {
          missingParts.push('Sınav HMAC Anahtarı (EXAM_HMAC_KEY)');
        }

        if (missingParts.length > 0) {
          toast({
            variant: 'destructive',
            title: 'Eksik Çevre Değişkenleri',
            description: `Aşağıdaki servis anahtarları tanımlı değil: ${missingParts.join(', ')}`,
          });
        }
      } catch (error) {
        console.error('Env status check failed:', error);
      }
    }

    verifyEnv();

    return () => {
      mounted = false;
    };
  }, [toast]);

  return null;
}

