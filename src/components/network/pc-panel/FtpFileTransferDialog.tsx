import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { FtpSession, PcFile } from './PCPanel.types';
import { getFtpFilesFromUploadDir } from './pcFileSystem';

interface FtpFileTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: FtpSession | null;
  localFiles: PcFile[];
  language: string;
  isDark: boolean;
  onGetFile: (fileName: string) => void;
  onPutFile: (fileName: string) => void;
}

function formatFileSize(bytes: number = 0): string {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 1024) return `${bytes} Bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FtpFileTransferDialog({
  open,
  onOpenChange,
  session,
  localFiles,
  language,
  isDark,
  onGetFile,
  onPutFile,
}: FtpFileTransferDialogProps) {
  if (!session) return null;

  const serverFilesFromFs = session.targetDeviceId ? getFtpFilesFromUploadDir(session.targetDeviceId) : [];
  const serverFiles = serverFilesFromFs.length > 0 ? serverFilesFromFs : (session.files || []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'tr' ? 'FTP Dosya Transferi' : 'FTP File Transfer'}
          </DialogTitle>
          <DialogDescription>
            {language === 'tr'
              ? `${session.host} sunucusuna bağlanıldı. Dosyaları indirin veya yükleyin.`
              : `Connected to ${session.host}. Download or upload files.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">
              {language === 'tr' ? 'Sunucu Dosyaları (İndir - C:\\upload)' : 'Server Files (Download - C:\\upload)'}
            </h4>
            <div className={`rounded-lg border divide-y ${isDark ? 'border-secondary-800 divide-secondary-800' : 'border-secondary-200 divide-secondary-200'}`}>
              {serverFiles.length === 0 ? (
                <div className="p-3 text-sm opacity-50">
                  {language === 'tr' ? '(sunucuda dosya yok)' : '(no files on server)'}
                </div>
              ) : serverFiles.map((file, idx) => (
                <div key={`srv-${file.name}-${idx}`} className="flex items-center justify-between p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs opacity-50">{formatFileSize(file.size || 0)}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      onGetFile(file.name);
                      onOpenChange(false);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {language === 'tr' ? 'İndir' : 'Download'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">
              {language === 'tr' ? 'Yerel Dosyaları Yükle (C:\\upload)' : 'Upload Local Files (C:\\upload)'}
            </h4>
            <div className={`rounded-lg border divide-y ${isDark ? 'border-secondary-800 divide-secondary-800' : 'border-secondary-200 divide-secondary-200'}`}>
              {localFiles.length === 0 ? (
                <div className="p-3 text-sm opacity-50">{language === 'tr' ? '(yerel dosya yok)' : '(no local files)'}</div>
              ) : localFiles.map((file) => (
                <div key={`upl-${file.name}-${file.size}`} className="flex items-center justify-between p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs opacity-50">{formatFileSize(file.size || 0)}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      onPutFile(file.name);
                      onOpenChange(false);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2 rotate-180" />
                    {language === 'tr' ? 'Yükle' : 'Upload'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
