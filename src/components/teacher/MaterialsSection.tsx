'use client'

import { useState, useEffect } from 'react' // <-- NEW: Imported useEffect
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  ImageIcon, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  Tag
} from 'lucide-react'

// This interface matches the data structure your component's UI already uses
interface Material {
  id: string
  name: string
  type: 'pdf' | 'image'
  size: string
  category: string
  uploadDate: string
  downloads: number
  views: number
  fileURL: string // <-- NEW: Added to hold the link to the actual file
}

export function MaterialsSection() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  
  // --- NEW: State for handling live data ---
  const [materials, setMaterials] = useState<Material[]>([]) // Start with an empty array
  const [isLoading, setIsLoading] = useState(true) // To show a loading message
  const [error, setError] = useState<string | null>(null) // To show an error message
  // --- END NEW ---

  // --- NEW: Helper function to format file size ---
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  // --- END NEW ---

  // --- NEW: useEffect hook to fetch data from your API ---
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/materials`)
        if (!response.ok) {
          throw new Error('Failed to fetch materials from the server.')
        }
        const dbData = await response.json()

        // Map the data from your MongoDB schema to the component's Material interface
        const formattedMaterials: Material[] = dbData.map((item: any) => ({
          id: item._id,
          name: item.fileName,
          type: item.contentType.includes('pdf') ? 'pdf' : 'image',
          size: formatFileSize(item.size),
          category: item.category || 'Uncategorized', // Add a default category
          uploadDate: item.uploadDate,
          downloads: item.downloads || 0, // Add a default value
          views: item.views || 0, // Add a default value
          fileURL: item.fileURL,
        }));

        setMaterials(formattedMaterials)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMaterials()
  }, []) // Empty array means this runs once when the component mounts
  // --- END NEW ---

  const categories = ['all', 'Mathematics', 'Science', 'English', 'History', 'Physics', 'Uncategorized'] // Added Uncategorized
  const types = ['all', 'pdf', 'image']

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory
    const matchesType = selectedType === 'all' || material.type === selectedType
    
    return matchesSearch && matchesCategory && matchesType
  })

  // The rest of your component's functions (getFileIcon, getCategoryColor) remain the same.
  const getFileIcon = (type: string) => {
    return type === 'pdf' ? (
      <FileText className="w-6 h-6 text-red-500" />
    ) : (
      <ImageIcon className="w-6 h-6 text-blue-500" />
    )
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Mathematics': 'bg-blue-100 text-blue-800',
      'Science': 'bg-green-100 text-green-800',
      'English': 'bg-purple-100 text-purple-800',
      'History': 'bg-orange-100 text-orange-800',
      'Physics': 'bg-indigo-100 text-indigo-800',
      'Uncategorized': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }
  
  // --- NEW: Render loading and error states ---
  if (isLoading) {
    return <p>Loading library...</p>
  }

  if (error) {
    return <p className="text-red-500">Error loading materials: {error}</p>
  }
  // --- END NEW ---

  return (
    <div className="space-y-6">
      {/* Your Header and Filters sections remain unchanged, they will work perfectly */}
       {/* Header */}
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Materials Library</h1>
          <p className="text-muted-foreground">Manage and organize your educational content</p>
        </div>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {types.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Materials Grid - This will now display your real data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => (
            // The download button now links to the actual file URL
             <Card key={material.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(material.type)}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-2">{material.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(material.category)}`}>
                            {material.category}
                          </span>
                          <span className="text-xs text-muted-foreground">{material.size}</span>
                        </div>
                      </div>
                    </div>
                    {/* Action buttons can be implemented later */}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(material.uploadDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Download className="w-3 h-3" />
                        <span>{material.downloads}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{material.views}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <a href={material.fileURL} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button size="sm" className="w-full">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
        ))}
      </div>

      {/* Empty State - This will now show if the database is empty */}
      {filteredMaterials.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">No materials found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'The library is empty. Start by uploading a new material.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}