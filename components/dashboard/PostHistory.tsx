import { formatThaiDate } from '../../lib/utils'

interface Post {
	id: string
	title: string
	status: string
	fbPostId: string | null
	postedAt: string | null
	createdAt: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
	POSTED: { label: 'โพสต์แล้ว', className: 'bg-green-100 text-green-700' },
	FAILED: { label: 'ล้มเหลว', className: 'bg-red-100 text-red-700' },
	PENDING: { label: 'รอโพสต์', className: 'bg-yellow-100 text-yellow-700' },
	SKIPPED: { label: 'ข้ามไป', className: 'bg-gray-100 text-gray-600' },
}

export function PostHistory({ posts }: { posts: Post[] }) {
	if (posts.length === 0) {
		return (
			<div className="text-center py-12 text-gray-400">
				No post history yet
			</div>
		)
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b text-left text-gray-500">
						<th className="pb-3 pr-4 font-medium">Title</th>
						<th className="pb-3 pr-4 font-medium">Status</th>
						<th className="pb-3 font-medium">Time</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-100">
					{posts.map((post) => {
						const config = statusConfig[post.status] ?? statusConfig.PENDING
						return (
							<tr key={post.id} className="hover:bg-gray-50">
								<td className="py-3 pr-4">
									<p className="font-medium text-gray-800 line-clamp-1">{post.title}</p>
									{post.fbPostId && (
										<p className="text-xs text-gray-400 mt-0.5">FB: {post.fbPostId}</p>
									)}
								</td>
								<td className="py-3 pr-4">
									<span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
										{config.label}
									</span>
								</td>
								<td className="py-3 text-gray-500 text-xs">
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