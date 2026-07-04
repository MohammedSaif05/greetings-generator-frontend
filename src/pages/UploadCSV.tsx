import { useState, useCallback, useMemo } from 'react';
import { API_URL } from '@/config/api';
import { FileSpreadsheet, Upload, Send, AlertCircle, CheckCircle2, User, Calendar, MessageSquare, PenLine } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateSingleGreeting, generateBulkGreetings } from '@/services/greetingApi';
import { GeneratedImage } from '@/types/greeting';
import GeneratedResults from '@/components/upload/GeneratedResults';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Orientation } from '@/types/template';

type Mode = 'single' | 'bulk';

interface FormData {
  templateId: string;
  recipientName: string;
  occasion: string;
  message: string;
  senderName: string;
}

interface TemplateSummary {
  templateId: string;
  orientation: Orientation;
  canvas: {
    width: number;
    height: number;
  };
  thumbnailUrl: string;
  status: string;
}

export default function UploadCSV() {
  const [mode, setMode] = useState<Mode>('single');
  const [formData, setFormData] = useState<FormData>({
    templateId: '',
    recipientName: '',
    occasion: '',
    message: '',
    senderName: '',
  });
  const [bulkTemplateId, setBulkTemplateId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedImage[]>([]);
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const selectedTemplateForSingle = useMemo(
    () => templates.find(t => t.templateId === formData.templateId) || null,
    [templates, formData.templateId]
  );

  const selectedTemplateForBulk = useMemo(
    () => templates.find(t => t.templateId === bulkTemplateId) || null,
    [templates, bulkTemplateId]
  );

  const isSingleFormComplete = useMemo(
    () =>
      ['recipientName', 'occasion', 'message', 'senderName'].every((field) =>
        formData[field as keyof FormData]?.trim()
      ),
    [formData]
  );

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields are filled
    const emptyFields = Object.entries(formData)
      .filter(([_, value]) => !value.trim())
      .map(([key]) => key);
    
    if (emptyFields.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedResults([]);

    try {
      const response = await generateSingleGreeting({
        templateId: formData.templateId.trim(),
        recipientName: formData.recipientName.trim(),
        occasion: formData.occasion.trim(),
        message: formData.message.trim(),
        senderName: formData.senderName.trim(),
      });

      if (response.status === 'SUCCESS' && response.results.length > 0) {
        setGeneratedResults(response.results);
        setFormData(prev => ({ ...prev, templateId: '' }));
        toast({
          title: "Success!",
          description: `Generated ${response.generated} greeting card${response.generated !== 1 ? 's' : ''}.`,
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "No cards were generated. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate greeting card.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File",
        description: "Please upload a CSV file first.",
        variant: "destructive",
      });
      return;
    }

    if (!bulkTemplateId.trim()) {
      toast({
        title: "Template ID Required",
        description: "Please enter a Template ID.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedResults([]);

    try {
      const response = await generateBulkGreetings(uploadedFile, bulkTemplateId.trim());

      if (response.status === 'SUCCESS' && response.results.length > 0) {
        setGeneratedResults(response.results);
        setBulkTemplateId('');
        toast({
          title: "Success!",
          description: `Generated ${response.generated} greeting card${response.generated !== 1 ? 's' : ''}.`,
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "No cards were generated. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate greeting cards.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel'];
    const isCSV = validTypes.includes(file.type) || file.name.endsWith('.csv');
    
    if (!isCSV) {
      setFileError('Invalid file type. Please upload a .csv file only.');
      setUploadedFile(null);
      return false;
    }
    
    setFileError(null);
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setUploadedFile(file);
      setGeneratedResults([]);
      toast({
        title: "File uploaded!",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setUploadedFile(file);
      setGeneratedResults([]);
      toast({
        title: "File uploaded!",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
    e.target.value = '';
  };

  const clearFile = () => {
    setUploadedFile(null);
    setFileError(null);
    setGeneratedResults([]);
  };

  const handleModeToggle = (nextMode: Mode) => {
    if (mode === nextMode) return;
    setMode(nextMode);
    setGeneratedResults([]);
  };

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoadingTemplates(true);
      setTemplatesError(null);
      const res = await fetch(`${API_URL}/api/templates`);
      if (!res.ok) {
        throw new Error(`Failed to load templates (${res.status})`);
      }
      const data: TemplateSummary[] = await res.json();
      setTemplates(data.filter(t => t.status === 'ACTIVE'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load templates.';
      setTemplatesError(message);
      toast({
        title: 'Template load failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [toast]);

  const openTemplateDialog = useCallback(async () => {
    setIsTemplateDialogOpen(true);
    await fetchTemplates();
  }, [fetchTemplates]);

  const closeTemplateDialog = () => {
    setIsTemplateDialogOpen(false);
  };

  const handleTemplateSelect = (template: TemplateSummary) => {
    if (mode === 'single') {
      setFormData(prev => ({ ...prev, templateId: template.templateId }));
    } else {
      setBulkTemplateId(template.templateId);
    }
    setIsTemplateDialogOpen(false);
  };

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">
            Generate Greeting Cards
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Create greeting cards individually or batch process using a CSV file.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex items-center rounded-full bg-primary p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleModeToggle('single')}
              className={cn(
                'px-6 py-2 text-sm font-medium rounded-full transition-all',
                mode === 'single'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-primary-foreground/80'
              )}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => handleModeToggle('bulk')}
              className={cn(
                'px-6 py-2 text-sm font-medium rounded-full transition-all',
                mode === 'bulk'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-primary-foreground/80'
              )}
            >
              Bulk
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {mode === 'single' ? (
            /* Single Mode - Form */
            <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="recipientName" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Recipient Name
                </Label>
                <Input
                  id="recipientName"
                  placeholder="Enter recipient's name"
                  value={formData.recipientName}
                  onChange={(e) => handleFormChange('recipientName', e.target.value)}
                  className="h-12 bg-background border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occasion" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Occasion
                </Label>
                <Input
                  id="occasion"
                  placeholder="e.g., Birthday, Anniversary, Thank You"
                  value={formData.occasion}
                  onChange={(e) => handleFormChange('occasion', e.target.value)}
                  className="h-12 bg-background border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Write your heartfelt message here..."
                  value={formData.message}
                  onChange={(e) => handleFormChange('message', e.target.value)}
                  className="min-h-[120px] bg-background border-border/50 focus:border-primary/50 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderName" className="text-sm font-medium flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-muted-foreground" />
                  Sender Name
                </Label>
                <Input
                  id="senderName"
                  placeholder="Enter your name"
                  value={formData.senderName}
                  onChange={(e) => handleFormChange('senderName', e.target.value)}
                  className="h-12 bg-background border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="pt-4 space-y-2">
                {selectedTemplateForSingle && (
                  <p className="text-xs text-muted-foreground">
                    Template: {selectedTemplateForSingle.templateId} · {selectedTemplateForSingle.orientation.charAt(0).toUpperCase() + selectedTemplateForSingle.orientation.slice(1)} · {selectedTemplateForSingle.canvas.width} × {selectedTemplateForSingle.canvas.height}
                  </p>
                )}
                {!formData.templateId.trim() ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={openTemplateDialog}
                    disabled={!isSingleFormComplete}
                    className="w-full h-12 text-base font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    Choose Template
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isGenerating}
                    className="w-full h-12 text-base font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Generate Now
                  </Button>
                )}
              </div>
            </form>
          ) : (
            /* Bulk Mode - Drag & Drop Upload */
            <div className="p-8">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200",
                  isDragging 
                    ? "border-primary bg-primary/5 scale-[1.01]" 
                    : "border-border/70 hover:border-primary/50 hover:bg-muted/30",
                  uploadedFile && !fileError && "border-primary/50 bg-primary/5",
                  fileError && "border-destructive/50 bg-destructive/5"
                )}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="pointer-events-none">
                  {uploadedFile && !fileError ? (
                    <>
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-lg font-medium text-foreground mb-1">
                        {uploadedFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                        className="pointer-events-auto"
                      >
                        Remove File
                      </Button>
                    </>
                  ) : fileError ? (
                    <>
                      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-7 h-7 text-destructive" />
                      </div>
                      <p className="text-lg font-medium text-destructive mb-1">
                        Upload Failed
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {fileError}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                        className="pointer-events-auto"
                      >
                        Try Again
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-lg font-medium text-foreground mb-1">
                        Drag & drop your CSV file here
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        or click to browse from your computer
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-xs text-muted-foreground">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Only .csv files are accepted
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {selectedTemplateForBulk && (
                  <p className="text-xs text-muted-foreground">
                    Template: {selectedTemplateForBulk.templateId} · {selectedTemplateForBulk.orientation.charAt(0).toUpperCase() + selectedTemplateForBulk.orientation.slice(1)} · {selectedTemplateForBulk.canvas.width} × {selectedTemplateForBulk.canvas.height}
                  </p>
                )}
                {!bulkTemplateId.trim() ? (
                  <Button
                    size="lg"
                    onClick={openTemplateDialog}
                    className="w-full h-12 text-base font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    Choose Template
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleBulkSubmit}
                    disabled={isGenerating || !uploadedFile || !!fileError}
                    className="w-full h-12 text-base font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Generate Now
                  </Button>
                )}
              </div>

              {/* CSV Format Guide */}
              <div className="mt-8 p-4 bg-muted/30 rounded-xl border border-border/30">
                <h4 className="text-sm font-medium text-foreground mb-2">
                  CSV Format Guide
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Your CSV file should include the following columns:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['recipientName', 'occasion', 'message', 'senderName'].map((field) => (
                    <span
                      key={field}
                      className="inline-flex px-2.5 py-1 bg-background rounded-md text-xs font-mono text-muted-foreground border border-border/50"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generated Results */}
        <GeneratedResults results={generatedResults} isLoading={isGenerating} />

        {/* Template chooser dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Choose Template</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              {isLoadingTemplates && (
                <p className="text-sm text-muted-foreground px-1 py-2">
                  Loading templates...
                </p>
              )}
              {templatesError && !isLoadingTemplates && (
                <p className="text-sm text-destructive px-1 py-2">
                  {templatesError}
                </p>
              )}
              {!isLoadingTemplates && !templatesError && templates.length === 0 && (
                <p className="text-sm text-muted-foreground px-1 py-2">
                  No templates available.
                </p>
              )}
              {!isLoadingTemplates && templates.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(template => (
                    <button
                      key={template.templateId}
                      type="button"
                      onClick={() => handleTemplateSelect(template)}
                      className="group text-left rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <div className="aspect-video overflow-hidden bg-muted/40">
                        <img
                          src={template.thumbnailUrl}
                          alt={template.templateId}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {template.templateId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {template.orientation.charAt(0).toUpperCase() + template.orientation.slice(1)} · {template.canvas.width} × {template.canvas.height}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <Button type="button" variant="outline" onClick={closeTemplateDialog}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
