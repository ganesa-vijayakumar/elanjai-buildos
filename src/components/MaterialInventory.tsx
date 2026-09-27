import { Project, DEFAULT_MATERIAL_NORMS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Warning, CheckCircle } from '@phosphor-icons/react';

interface MaterialInventoryProps {
  projects: Project[];
}

export function MaterialInventory({ projects }: MaterialInventoryProps) {
  const calculateMaterialAnalysis = (project: Project) => {
    const analysis = DEFAULT_MATERIAL_NORMS.map(norm => {
      const expectedQuantity = (project.squareFootage / 1000) * norm.quantityPer1000SqFt;
      const actualUsed = project.materialUsage?.[norm.materialType] || 0;
      const usagePercent = expectedQuantity > 0 ? (actualUsed / expectedQuantity) * 100 : 0;
      const variance = actualUsed - expectedQuantity;
      const isOverage = usagePercent > 110;
      
      return {
        materialType: norm.materialType,
        unit: norm.unit,
        expected: expectedQuantity,
        actual: actualUsed,
        usagePercent,
        variance,
        isOverage,
      };
    });

    return analysis;
  };

  const activeProjects = projects.filter(p => p.status !== 'completed');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Material Norms Settings</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Standard material requirements per 1000 sq.ft of construction
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Material Type</TableHead>
                <TableHead className="font-semibold">Unit</TableHead>
                <TableHead className="font-semibold">Quantity per 1000 sq.ft</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEFAULT_MATERIAL_NORMS.map(norm => (
                <TableRow key={norm.id}>
                  <TableCell className="font-medium">{norm.materialType}</TableCell>
                  <TableCell>{norm.unit}</TableCell>
                  <TableCell className="font-semibold">{norm.quantityPer1000SqFt.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-gray-600">{norm.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {activeProjects.map(project => {
          const analysis = calculateMaterialAnalysis(project);
          const hasOverages = analysis.some(a => a.isOverage);

          return (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {project.squareFootage.toLocaleString()} sq.ft • Current: {project.currentStage}
                    </p>
                  </div>
                  {hasOverages && (
                    <Badge className="bg-rose-600 hover:bg-rose-700 flex items-center gap-1">
                      <Warning size={16} weight="fill" />
                      Wastage Alert
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Material</TableHead>
                      <TableHead className="font-semibold">Expected</TableHead>
                      <TableHead className="font-semibold">Actual Used</TableHead>
                      <TableHead className="font-semibold">Usage %</TableHead>
                      <TableHead className="font-semibold">Variance</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.map(item => (
                      <TableRow key={item.materialType}>
                        <TableCell className="font-medium">{item.materialType}</TableCell>
                        <TableCell>
                          {item.expected.toLocaleString(undefined, { maximumFractionDigits: 0 })} {item.unit}
                        </TableCell>
                        <TableCell className={item.isOverage ? 'text-rose-600 font-semibold' : ''}>
                          {item.actual.toLocaleString(undefined, { maximumFractionDigits: 0 })} {item.unit}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  item.isOverage ? 'bg-rose-600' : 'bg-emerald-600'
                                }`}
                                style={{ width: `${Math.min(item.usagePercent, 100)}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${
                              item.isOverage ? 'text-rose-600' : 'text-gray-700'
                            }`}>
                              {item.usagePercent.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={item.variance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {item.variance > 0 ? '+' : ''}{item.variance.toLocaleString(undefined, { maximumFractionDigits: 0 })} {item.unit}
                        </TableCell>
                        <TableCell>
                          {item.isOverage ? (
                            <Badge variant="outline" className="border-rose-600 text-rose-600">
                              <Warning size={14} weight="fill" className="mr-1" />
                              Over Norm
                            </Badge>
                          ) : item.actual > 0 ? (
                            <Badge variant="outline" className="border-emerald-600 text-emerald-600">
                              <CheckCircle size={14} weight="fill" className="mr-1" />
                              Within Norm
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-400 text-gray-600">
                              Not Started
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}

        {activeProjects.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              No active projects to track material usage
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
