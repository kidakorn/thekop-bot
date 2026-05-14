import { cn } from '../../lib/utils'

interface StatsCardProps {
	title: string
	value: number
	icon: string
	color?: 'green' | 'red' | 'yellow' | 'blue'
}

const colorMap = {
	green: 'bg-green-50 text-green-700 border-green-200',
	red: 'bg-red-50 text-red-700 border-red-200',
	yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
	blue: 'bg-blue-50 text-blue-700 border-blue-200',
}

export function StatsCard({ title, value, icon, color = 'blue' }: StatsCardProps) {
	return (
		<div className={cn('rounded-xl border p-6 flex items-center gap-4', colorMap[color])}>
			<div className="text-3xl">{icon}</div>
			<div>
				<p className="text-sm font-medium opacity-70">{title}</p>
				<p className="text-3xl font-bold">{value}</p>
			</div>
		</div>
	)
}