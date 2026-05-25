interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export const StatsCard = ({ title, value, subtitle, className }: StatsCardProps) => {
  return (
    <div className={`glass-panel p-5 ${className ?? ''}`}>
      <div className="text-sm text-muted-foreground mb-2">{title}</div>
      <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">{value}</div>
      {subtitle && (
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      )}
    </div>
  );
};
