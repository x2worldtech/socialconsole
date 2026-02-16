import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, FileText, Loader2 } from 'lucide-react';
import { SiGiphy } from 'react-icons/si';
import { toast } from 'sonner';
import { ExternalBlob, AttachmentType } from '../backend';

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMediaSelected: (attachments: Array<{ id: string; type: AttachmentType; file: ExternalBlob }>) => void;
}

export default function MediaLibraryDialog({ open, onOpenChange, onMediaSelected }: MediaLibraryDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: AttachmentType) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const attachments: Array<{ id: string; type: AttachmentType; file: ExternalBlob }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
          continue;
        }

        // Validate file type
        if (type === AttachmentType.image && !file.type.startsWith('image/')) {
          toast.error(`File "${file.name}" is not a valid image.`);
          continue;
        }

        if (type === AttachmentType.gif && !file.type.includes('gif')) {
          toast.error(`File "${file.name}" is not a valid GIF.`);
          continue;
        }

        // Read file as bytes
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // Create ExternalBlob with upload progress tracking
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });

        attachments.push({
          id: `${Date.now()}-${i}`,
          type,
          file: blob,
        });
      }

      if (attachments.length > 0) {
        onMediaSelected(attachments);
        onOpenChange(false);
        toast.success(`${attachments.length} file(s) ready to send`);
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to process files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Media Library</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select media to send in your message
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="image" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Image className="w-4 h-4 mr-2" />
              Images
            </TabsTrigger>
            <TabsTrigger value="gif" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <SiGiphy className="w-4 h-4 mr-2" />
              GIFs
            </TabsTrigger>
            <TabsTrigger value="document" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-4 mt-4">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/20">
              <Image className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Upload images (JPG, PNG, WebP)
              </p>
              <label htmlFor="image-upload">
                <Button
                  type="button"
                  variant="default"
                  disabled={uploading}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading {uploadProgress}%
                    </>
                  ) : (
                    'Choose Images'
                  )}
                </Button>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, AttachmentType.image)}
                disabled={uploading}
              />
            </div>
          </TabsContent>

          <TabsContent value="gif" className="space-y-4 mt-4">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/20">
              <SiGiphy className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Upload animated GIFs
              </p>
              <label htmlFor="gif-upload">
                <Button
                  type="button"
                  variant="default"
                  disabled={uploading}
                  onClick={() => document.getElementById('gif-upload')?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading {uploadProgress}%
                    </>
                  ) : (
                    'Choose GIFs'
                  )}
                </Button>
              </label>
              <input
                id="gif-upload"
                type="file"
                accept="image/gif"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, AttachmentType.gif)}
                disabled={uploading}
              />
            </div>
          </TabsContent>

          <TabsContent value="document" className="space-y-4 mt-4">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/20">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Upload documents (PDF, DOC, TXT, etc.)
              </p>
              <label htmlFor="document-upload">
                <Button
                  type="button"
                  variant="default"
                  disabled={uploading}
                  onClick={() => document.getElementById('document-upload')?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading {uploadProgress}%
                    </>
                  ) : (
                    'Choose Documents'
                  )}
                </Button>
              </label>
              <input
                id="document-upload"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, AttachmentType.document_)}
                disabled={uploading}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground text-center mt-2">
          Maximum file size: 10MB per file
        </div>
      </DialogContent>
    </Dialog>
  );
}
