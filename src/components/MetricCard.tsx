import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
}

export default function MetricCard({
  id,
  title,
  value,
  subtitle,
  trend,
  trendType = 'neutral',
  icon: Icon
}: MetricCardProps) {
  return (
    <div
      id={id}
      className="bg-white border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] flex items-start justify-between hover:-translate-y-0.5 transition-transform duration-200"
    >
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-[#141414]/70">
          {title}
        </span>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold font-mono tracking-tight text-[#141414]">
            {value}
          </span>
          {trend && (
            <span
              className={`text-[9px] uppercase tracking-wider font-extrabold font-mono px-2 py-0.5 border border-[#141414] ${
                trendType === 'positive'
                  ? 'bg-emerald-500 text-[#141414]'
                  : trendType === 'negative'
                  ? 'bg-rose-500 text-white'
                  : 'bg-[#DCDAD7] text-[#141414]'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
        <p className="text-[10px] text-[#141414]/60 font-serif italic">{subtitle}</p>
      </div>
      <div className="p-2.5 bg-[#141414] text-[#E4E3E0] shrink-0 border border-[#141414]">
        <Icon size={16} />
      </div>
    </div>
  );
}
