import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/utils';

interface StatCardProps {
  label: string;
  value: string | ReactNode;
  subValue?: string | ReactNode;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  valueClassName?: string;
  className?: string;
}

export function StatCard({ label, value, subValue, change, changeLabel, trend, valueClassName, className }: StatCardProps) {
  const isPositive = change !== undefined ? change >= 0 : trend === 'up';
  const isNegative = change !== undefined ? change < 0 : trend === 'down';

  return (
    <div className={cn('card flex flex-col gap-1', className)}>
      <div className="text-sm font-medium text-text-secondary">{label}</div>
      <div className={cn('text-2xl font-bold flex items-baseline gap-2', valueClassName)}>
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-text-muted">{subValue}</div>
      )}
      {(change !== undefined || changeLabel) && (
        <div
          className={`text-xs mt-1 flex items-center gap-1 ${
            isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-text-muted'
          }`}
        >
          {isPositive && <TrendingUp className="w-3 h-3" />}
          {isNegative && <TrendingDown className="w-3 h-3" />}
          <span>
            {change !== undefined && `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}
            {changeLabel && ` ${changeLabel}`}
          </span>
        </div>
      )}
    </div>
  );
}
