import { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StatsCardProps {
	title: string
	value: number
	icon: LucideIcon
	variant?: 'success' | 'error' | 'warning' | 'info'
}

const variantMap = {
	success: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
	error:   'bg-error/10   text-error   border-error/20   hover:bg-error/20',
	warning: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
	info:    'bg-info/10    text-info    border-info/20    hover:bg-info/20',
}

export function StatsCard({ title, value, icon: Icon, variant = 'info' }: StatsCardProps) {
	return (
		<div
			className={cn(
				'rounded-2xl border p-5 md:p-6 flex items-center gap-4',
				'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
				'focus-visible:ring-2 focus-visible:ring-primary-red active:scale-[0.98]',
				variantMap[variant],
			)}
		>
			<div className="p-3 rounded-xl bg-white/30 shrink-0">
				<Icon size={22} />
			</div>
			<div className="min-w-0">
				<p className="text-sm font-medium opacity-70 truncate">{title}</p>
				<p className="text-3xl font-bold leading-tight">{value}</p>
			</div>
		</div>
	)
}