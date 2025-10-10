'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Plus, Edit, Trash2, Eye, Send, Calendar, Save } from 'lucide-react'

// Interface matches the MongoDB data structure
interface Notice {
  _id: string;
  title: string;
  content: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  publishDate?: string;
  views?: number;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export function NoticesSection() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [view, setView] = useState<'list' | 'form'>('list'); // Controls showing the list or the form
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null); // To hold the notice being edited
  
  // This state is now used for both creating and editing
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const categories = ['general', 'exam', 'assignment', 'event', 'reminder'];
  const priorities = ['low', 'medium', 'high'];
  const statuses = ['all', 'draft', 'published', 'archived'];
  
  // Function to fetch all notices from the database
  const fetchNotices = async () => {
    setIsLoading(true);
    try {
const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/notices`);
      if (!response.ok) throw new Error("Failed to fetch notices");
      const data = await response.json();
      setNotices(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notices when the component first loads
  useEffect(() => {
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter(notice => 
    selectedStatus === 'all' || notice.status === selectedStatus
  );

  // Handlers for form input changes
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Logic to show the form for creating a new notice
  const handleAddNew = () => {
    setEditingNotice(null);
    setFormData({
      title: '', content: '', category: 'general', priority: 'medium'
    });
    setView('form');
  };

  // Logic to show the form for editing an existing notice
  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
    });
    setView('form');
  };
  
  const handleFormSubmit = async () => {
    if (!formData.title || !formData.content || !formData.category) {
        alert("Please fill all required fields.");
        return;
    }
    setIsSubmitting(true);
    try {
      let response;
      if (editingNotice) {
        // This is an UPDATE (PUT request)
        response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/notices/${editingNotice._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        // This is a CREATE (POST request)
        response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/notices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, status: 'draft' })
        });
      }
      if (!response.ok) throw new Error("Failed to save notice");
      
      await fetchNotices();
      setView('list'); // Go back to the list view
    } catch (error) {
        console.error(error);
        alert("Error saving notice.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePublishNotice = async (id: string) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/notices/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'published' })
        });
        if (!response.ok) throw new Error("Failed to publish notice");
        await fetchNotices(); // Refresh the list
    } catch (error) {
        console.error(error);
        alert("Error publishing notice.");
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/notices/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error("Failed to delete notice");
        await fetchNotices(); // Refresh the list
    } catch (error) {
        console.error(error);
        alert("Error deleting notice.");
    }
  };
  
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {'general':'bg-blue-100 text-blue-800','exam':'bg-red-100 text-red-800','assignment':'bg-green-100 text-green-800','event':'bg-purple-100 text-purple-800','reminder':'bg-orange-100 text-orange-800'}
    return colors[category] || 'bg-gray-100 text-gray-800'
  };
  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {'low':'bg-green-100 text-green-800','medium':'bg-yellow-100 text-yellow-800','high':'bg-red-100 text-red-800'}
    return colors[priority] || 'bg-gray-100 text-gray-800'
  };
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {'draft':'bg-gray-100 text-gray-800','published':'bg-green-100 text-green-800','archived':'bg-orange-100 text-orange-800'}
    return colors[status] || 'bg-gray-100 text-gray-800'
  };

  if (isLoading) { return <p className="text-center p-8">Loading notices...</p>; }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Notices & Announcements</h1>
          <p className="text-muted-foreground">Create and manage announcements for your students</p>
        </div>
        {view === 'list' && (
          <Button onClick={handleAddNew}><Plus className="w-4 h-4 mr-2" />Create Notice</Button>
        )}
      </div>

      {view === 'form' ? (
        // THE CREATE/EDIT FORM
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{editingNotice ? 'Edit Notice' : 'Create New Notice'}</CardTitle>
            <CardDescription>{editingNotice ? 'Update the details for your announcement' : 'Fill in the details for your new announcement'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Notice Title</Label>
              <Input id="title" placeholder="e.g., Mid-Term Exam Schedule" value={formData.title} onChange={(e) => handleFormChange('title', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleFormChange('category', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: any) => handleFormChange('priority', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{priorities.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="content">Notice Content</Label>
              <Textarea id="content" placeholder="Write the main content of the notice here..." rows={6} value={formData.content} onChange={(e) => handleFormChange('content', e.target.value)} />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleFormSubmit} disabled={isSubmitting}><Save className="w-4 h-4 mr-2" />{isSubmitting ? 'Saving...' : (editingNotice ? 'Save Changes' : 'Save as Draft')}</Button>
              <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // THE NOTICES LIST VIEW
        <>
          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="flex items-center space-x-2"><Bell className="w-5 h-5" /><span>Filter Notices</span></CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Notices List */}
          <div className="space-y-4">
            {filteredNotices.map((notice) => (
              <Card key={notice._id} className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{notice.title}</CardTitle>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(notice.priority)}`}>{notice.priority}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(notice.status)}`}>{notice.status}</span>
                      </div>
                      <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(notice.category)}`}>{notice.category}</span>
                        {notice.publishDate && (<div className="flex items-center space-x-1"><Calendar className="w-4 h-4" /><span>{new Date(notice.publishDate).toLocaleDateString()}</span></div>)}
                        <div className="flex items-center space-x-1"><Eye className="w-4 h-4" /><span>{notice.views || 0} views</span></div>
                      </div>
                      <CardDescription className="line-clamp-3">{notice.content}</CardDescription>
                    </div>
                    <div className="flex flex-col space-y-1 items-end">
                      {notice.status === 'draft' && (<Button size="sm" onClick={() => handlePublishNotice(notice._id)}><Send className="w-4 h-4 mr-1" /> Publish</Button>)}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(notice)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteNotice(notice._id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredNotices.length === 0 && !isLoading && (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-primary mb-2">No notices found</h3>
                <p className="text-muted-foreground text-center mb-4">{selectedStatus !== 'all' ? 'No notices with the selected status' : 'Start by creating your first notice'}</p>
                <Button onClick={handleAddNew}><Plus className="w-4 h-4 mr-2" />Create Notice</Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}