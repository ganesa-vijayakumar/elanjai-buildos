import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@phosphor-icons/react';

interface KPICardProps {
  label: string;
  value: string;
  icon: Icon;
  trend?: 'positive' | 'negative' | 'neutral';
  valueColor?: string;
}

export function KPICard({ label, value, icon: IconComponent, trend, valueColor }: KPICardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className={`text-3xl font-bold mt-2 ${valueColor || 'text-gray-900'}`}>
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${
            trend === 'positive' 
              ? 'bg-emerald-100 text-emerald-600' 
              : trend === 'negative' 
              ? 'bg-rose-100 text-rose-600' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <IconComponent size={32} weight="fill" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
