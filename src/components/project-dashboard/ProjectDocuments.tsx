import { Project } from '../../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { FileText, Download } from 'lucide-react'
import { Button } from '../ui/button'

interface ProjectDocumentsProps {
  project: Project
}

export function ProjectDocuments({ project }: ProjectDocumentsProps) {
  const documents = [
    { id: '1', name: 'Construction Agreement', type: 'PDF', date: '2025-01-15', size: '2.4 MB' },
    { id: '2', name: 'Approved Plans', type: 'PDF', date: '2025-01-10', size: '5.1 MB' },
    { id: '3', name: 'Material Specifications', type: 'XLSX', date: '2025-01-20', size: '156 KB' },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-red-100">
                    <FileText className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-sm text-gray-600">
                      {doc.type} • {doc.size} • {doc.date}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
