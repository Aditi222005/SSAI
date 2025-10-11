'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Upload, 
  FileText, 
  Image, 
  Bell, 
  X, 
  CheckCircle,
  AlertCircle,
  File,
  ImageIcon,
  MessageSquare
} from 'lucide-react'

type UploadType = 'pdf' | 'image' | 'notice'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'success' | 'error'
  errorMessage?: string
}

export function UploadSection() {
  const [uploadType, setUploadType] = useState<UploadType>('pdf')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [noticeTitle, setNoticeTitle] = useState('')
  const [noticeContent, setNoticeContent] = useState('')
  const [category, setCategory] = useState('general')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    for (const fileInfo of newFiles) {
      const fileToUpload = acceptedFiles.find(f => `${f.name}-${f.lastModified}` === fileInfo.id);
      if (!fileToUpload) continue;

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('category', category);

      try {
        const response = await fetch('/api/upload-file', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Upload failed');
        }
        if (data.ingested === false) {
          throw new Error('Upload succeeded but processing for chatbot search failed');
        }
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileInfo.id ? { ...f, status: 'success' } : f)
        );
      } catch (err: any) {
        console.error('Upload error:', err);
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileInfo.id ? { ...f, status: 'error', errorMessage: err.message } : f)
        );
      }
    }
  }, [category]);

  const handlePublishNotice = async () => {
    if (!noticeTitle || !noticeContent) {
      alert("Please fill in the notice title and content.");
      return;
    }
    setIsSubmitting(true);
    try {
      // ================== THE FINAL, CORRECT URL ==================
      const response = await fetch('/api/notices', {
      // ==========================================================
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: noticeTitle, content: noticeContent, category, status: 'published' }), // Send as 'published' directly
      });
      if (!response.ok) { throw new Error('Failed to publish notice'); }
      alert('Notice published successfully!');
      setNoticeTitle('');
      setNoticeContent('');
      setCategory('general');
    } catch (err) {
      console.error(err);
      alert('Error publishing notice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: uploadType === 'pdf' 
      ? { 'application/pdf': ['.pdf'] }
      : { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    disabled: uploadType === 'notice'
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

 const getUploadIcon = () => {
  if (uploadType === 'pdf') return <FileText className="w-5 h-5 text-primary" />;
  if (uploadType === 'image') return <ImageIcon className="w-5 h-5 text-primary" />;
  if (uploadType === 'notice') return <Bell className="w-5 h-5 text-primary" />;
  return null;
};

const getUploadTitle = () => {
  if (uploadType === 'pdf') return "Upload PDF Documents";
  if (uploadType === 'image') return "Upload Images";
  if (uploadType === 'notice') return "Create a Notice";
  return "";
};

const getUploadDescription = () => {
  if (uploadType === 'pdf') return "Upload PDF study materials for your students.";
  if (uploadType === 'image') return "Upload images (PNG, JPG, JPEG, GIF, WebP).";
  if (uploadType === 'notice') return "Write and publish a notice for your students.";
  return "";
};


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Upload Content</h1>
        <p className="text-muted-foreground">Upload PDFs, images, and create notices for your students</p>
      </div>

      {/* Upload Type Selector */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Select Upload Type</CardTitle>
          <CardDescription>Choose what type of content you want to upload</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant={uploadType === 'pdf' ? 'default' : 'outline'} className="h-20 flex flex-col items-center justify-center space-y-2" onClick={() => setUploadType('pdf')}><FileText className="w-6 h-6" /><span>PDF Documents</span></Button>
            <Button variant={uploadType === 'image' ? 'default' : 'outline'} className="h-20 flex flex-col items-center justify-center space-y-2" onClick={() => setUploadType('image')}><ImageIcon className="w-6 h-6" /><span>Images</span></Button>
            <Button variant={uploadType === 'notice' ? 'default' : 'outline'} className="h-20 flex flex-col items-center justify-center space-y-2" onClick={() => setUploadType('notice')}><MessageSquare className="w-6 h-6" /><span>Notices</span></Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">{getUploadIcon()}<span>{getUploadTitle()}</span></CardTitle>
          <CardDescription>{getUploadDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {uploadType === 'notice' ? (
            // Notice Creation Form
            <div className="space-y-4">
              <div>
                <Label htmlFor="notice-title">Notice Title</Label>
                <Input id="notice-title" placeholder="Enter notice title..." value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notice-content">Notice Content</Label>
                <Textarea id="notice-content" placeholder="Enter notice content..." rows={6} value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} />
              </div>
              <Button onClick={handlePublishNotice} disabled={isSubmitting} className="w-full">
                <Bell className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Publishing...' : 'Publish Notice'}
              </Button>
            </div>
          ) : (
            // File Upload Area
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="file-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="timetable">Timetable</SelectItem>
                    <SelectItem value="study-material">Study Material</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${ isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50' }`}>
                <input {...getInputProps()} />
                <div className="space-y-4">
                  {getUploadIcon()}
                  <div>
                    <h3 className="text-lg font-medium text-primary">{isDragActive ? 'Drop files here' : 'Drag & drop files here'}</h3>
                    <p className="text-muted-foreground">or click to select files</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {uploadType === 'pdf' && 'Supports: PDF files (max 10MB each)'}
                    {uploadType === 'image' && 'Supports: PNG, JPG, JPEG, GIF, WebP (max 5MB each)'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Uploaded Files</CardTitle><CardDescription>Manage your uploaded content</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      {file.type.includes('pdf') ? <FileText className="w-5 h-5 text-primary" /> : <ImageIcon className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium text-primary truncate max-w-xs">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'uploading' && (<div className="flex items-center space-x-1 text-yellow-600"><div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" /><span className="text-sm">Uploading...</span></div>)}
                    {file.status === 'success' && (<div className="flex items-center space-x-1 text-green-600"><CheckCircle className="w-4 h-4" /><span className="text-sm">Uploaded</span></div>)}
                    {file.status === 'error' && (<div className="flex items-center space-x-1 text-red-600" title={file.errorMessage}><AlertCircle className="w-4 h-4" /><span className="text-sm">Error</span></div>)}
                    <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}