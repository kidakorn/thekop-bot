import { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StatsCardProps {
	title: string
	value: number
	icon: LucideIcon
	variant?: 'success' | 'error' | 'warning' | 'info'
}

const variantMap = {
	success: 'bg-success/10 text-success border-success/20',
	error: 'bg-error/10 text-error border-error/20',
	warning: 'bg-warning/10 text-warning border-warning/20',
	info: 'bg-info/10 text-info border-info/20',
}

export function StatsCard({ title, value, icon: Icon, variant = 'info' }: StatsCardProps) {
	return (
		<div className={cn('rounded-2xl border p-6 flex items-center gap-4', variantMap[variant])}>
			<div className="p-3 rounded-xl bg-white/20">
				<Icon size={24} />
			</div>
			<div>
				<p className="text-sm font-medium opacity-70">{title}</p>
				<p className="text-3xl font-bold">{value}</p>
			</div>
		</div>
	)
}