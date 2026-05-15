import { formatThaiDate } from '../../lib/utils'
import { CheckCircle, XCircle, Clock, SkipForward, FileText } from 'lucide-react'

interface Post {
	id: string
	title: string
	status: string
	fbPostId: string | null
	postedAt: string | null
	createdAt: string
}

const statusConfig: Record<string, {
	label: string
	className: string
	icon: React.ReactNode
}> = {
	POSTED:  { label: 'Posted',  className: 'badge-success', icon: <CheckCircle  size={12} /> },
	FAILED:  { label: 'Failed',  className: 'badge-error',   icon: <XCircle      size={12} /> },
	PENDING: { label: 'Pending', className: 'badge-warning', icon: <Clock        size={12} /> },
	SKIPPED: { label: 'Skipped', className: 'badge-ghost',   icon: <SkipForward  size={12} /> },
}

export function PostHistory({ posts }: { posts: Post[] }) {
	if (posts.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 gap-3 text-base-content/40">
				<FileText size={40} strokeWidth={1.5} />
				<p className="text-sm font-medium">No post history yet</p>
			</div>
		)
	}

	return (
		<div className="overflow-x-auto rounded-xl">
			<table className="table table-zebra w-full">
				<thead>
					<tr className="text-dark-bg/70 text-xs uppercase tracking-wide">
						<th className="w-full">Title</th>
						<th>Status</th>
						<th className="whitespace-nowrap">Time</th>
					</tr>
				</thead>
				<tbody>
					{posts.map((post) => {
						const config = statusConfig[post.status] ?? statusConfig.PENDING
						return (
							<tr
								key={post.id}
								className="hover:bg-base-200/60 transition-colors duration-150"
							>
								<td>
									<p className="font-medium text-dark-bg line-clamp-1">{post.title}</p>
									{post.fbPostId && (
										<p className="text-xs text-base-content/40 mt-0.5 truncate">
											FB: {post.fbPostId}
										</p>
									)}
								</td>
								<td>
									<span className={`badge gap-1.5 font-medium ${config.className}`}>
										{config.icon}
										{config.label}
									</span>
								</td>
								<td className="text-sm text-base-content/60 whitespace-nowrap">
									{formatThaiDate(new Date(post.postedAt ?? post.createdAt))}
								</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}