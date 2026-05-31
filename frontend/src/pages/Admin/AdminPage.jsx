import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, Users, FileText, Flag, Hash, Eye, EyeOff, Trash2, ShieldBan, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin.api'
import { useAuthStore } from '../../stores/authStore'
import { timeAgo, formatCount, getErrorMessage } from '../../lib/utils'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'

const TABS = [
  { id: 'stats', label: 'Dashboard', icon: BarChart3 },
  { id: 'users', label: 'Người dùng', icon: Users },
  { id: 'posts', label: 'Bài viết', icon: FileText },
  { id: 'reports', label: 'Báo cáo', icon: Flag },
  { id: 'hashtags', label: 'Hashtag', icon: Hash },
]

export default function AdminPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('stats')

  useEffect(() => {
    if (user?.role !== 'admin') navigate('/')
  }, [user])

  if (user?.role !== 'admin') return null

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-[#262626] rounded-lg flex items-center justify-center">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <h1 className="text-xl font-semibold text-[#262626]">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#dbdbdb] overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                tab === t.id ? 'text-[#262626] border-[#262626]' : 'text-[#8e8e8e] border-transparent hover:text-[#262626]'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'stats' && <StatsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'posts' && <PostsTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'hashtags' && <HashtagsTab />}
    </div>
  )
}

/* ─── Stats ─────────────────────────────────────────────────────────────────── */
function StatsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Không thể tải thống kê'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-16"><Spinner size={32} /></div>
  if (!stats) return null

  const cards = [
    { label: 'Tổng người dùng', value: formatCount(stats.totalUsers), sub: `+${stats.newUsersToday} hôm nay`, color: 'bg-blue-50 text-blue-600' },
    { label: 'Tổng bài viết', value: formatCount(stats.totalPosts), sub: `+${stats.newPostsToday} hôm nay`, color: 'bg-purple-50 text-purple-600' },
    { label: 'Báo cáo chờ xử lý', value: formatCount(stats.pendingReports), sub: 'cần xem xét', color: 'bg-red-50 text-red-600' },
    { label: 'Tổng bình luận', value: formatCount(stats.totalComments ?? 0), sub: 'tất cả thời gian', color: 'bg-green-50 text-green-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl p-5 ${c.color.split(' ')[0]}`}>
            <p className="text-sm text-[#8e8e8e] mb-1">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color.split(' ')[1]}`}>{c.value}</p>
            <p className="text-xs text-[#8e8e8e] mt-1">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Users ──────────────────────────────────────────────────────────────────── */
function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async (p = 1, q = search) => {
    setLoading(true)
    try {
      const { data } = await adminApi.getUsers({ page: p, limit: 15, search: q })
      setUsers(data.data.users)
      setTotalPages(data.data.pagination?.totalPages || 1)
    } catch { toast.error('Không thể tải danh sách user') }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load(1) }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    load(1, search)
  }

  const handleBan = async (userId, isBanned) => {
    try {
      if (isBanned) {
        await adminApi.unbanUser(userId)
        toast.success('Đã mở khóa tài khoản')
      } else {
        await adminApi.banUser(userId, {})
        toast.success('Đã khóa tài khoản')
      }
      load(page)
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo username hoặc email..."
          className="flex-1 text-sm border border-[#dbdbdb] rounded-lg px-3 py-2 outline-none focus:border-[#a8a8a8]"
        />
        <button type="submit" className="px-4 py-2 bg-[#262626] text-white text-sm rounded-lg hover:bg-black">Tìm</button>
      </form>

      {loading ? <div className="flex justify-center py-10"><Spinner size={28} /></div> : (
        <div className="bg-white border border-[#dbdbdb] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-[#dbdbdb]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Người dùng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Đăng ký</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dbdbdb]">
              {users.map((u) => (
                <tr key={u._id} className={u.isBanned ? 'bg-red-50/30' : ''}>
                  <td className="px-4 py-3">
                    <Link to={`/${u.username}`} className="flex items-center gap-2">
                      <Avatar src={u.avatar} size={28} />
                      <span className="font-semibold text-[#262626]">{u.username}</span>
                      {u.isBanned && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Bị khóa</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#8e8e8e]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8e8e8e] text-xs">{timeAgo(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleBan(u._id, u.isBanned)}
                        className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${u.isBanned ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {u.isBanned ? <><ShieldCheck size={12} /> Mở khóa</> : <><ShieldBan size={12} /> Khóa</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 px-4 py-3 border-t border-[#dbdbdb]">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => { setPage(p); load(p) }} className={`w-8 h-8 text-sm rounded-lg ${page === p ? 'bg-[#262626] text-white' : 'hover:bg-gray-100'}`}>{p}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Posts ──────────────────────────────────────────────────────────────────── */
function PostsTab() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await adminApi.getPosts({ page: p, limit: 15 })
      setPosts(data.data.posts)
      setTotalPages(data.data.pagination?.totalPages || 1)
    } catch { toast.error('Không thể tải danh sách bài viết') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(1) }, [])

  const handleHide = async (postId, isHidden) => {
    try {
      if (isHidden) await adminApi.unhidePost(postId)
      else await adminApi.hidePost(postId)
      toast.success(isHidden ? 'Đã hiện bài viết' : 'Đã ẩn bài viết')
      load(page)
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  const handleDelete = async (postId) => {
    if (!confirm('Xóa bài viết này vĩnh viễn?')) return
    try {
      await adminApi.deletePost(postId)
      toast.success('Đã xóa bài viết')
      load(page)
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  return (
    <div className="space-y-4">
      {loading ? <div className="flex justify-center py-10"><Spinner size={28} /></div> : (
        <div className="bg-white border border-[#dbdbdb] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-[#dbdbdb]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Bài viết</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Tác giả</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Lượt thích</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Đăng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dbdbdb]">
              {posts.map((post) => (
                <tr key={post._id} className={post.isHidden ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-3">
                    <Link to={`/p/${post._id}`} className="flex items-center gap-2">
                      {post.media?.[0] && (
                        <img src={post.media[0].url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                      )}
                      <span className="text-[#262626] line-clamp-1 max-w-[200px]">
                        {post.content || '(Không có caption)'}
                      </span>
                      {post.isHidden && <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded shrink-0">Đã ẩn</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/${post.author?.username}`} className="flex items-center gap-1">
                      <Avatar src={post.author?.avatar} size={22} />
                      <span className="text-[#262626] font-semibold">{post.author?.username}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#8e8e8e]">{formatCount(post.likeCount)}</td>
                  <td className="px-4 py-3 text-[#8e8e8e] text-xs">{timeAgo(post.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleHide(post._id, post.isHidden)} className="p-1.5 rounded-lg hover:bg-gray-100" title={post.isHidden ? 'Hiện bài' : 'Ẩn bài'}>
                        {post.isHidden ? <Eye size={14} className="text-green-600" /> : <EyeOff size={14} className="text-[#8e8e8e]" />}
                      </button>
                      <button onClick={() => handleDelete(post._id)} className="p-1.5 rounded-lg hover:bg-red-50" title="Xóa bài">
                        <Trash2 size={14} className="text-[#ed4956]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 px-4 py-3 border-t border-[#dbdbdb]">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => { setPage(p); load(p) }} className={`w-8 h-8 text-sm rounded-lg ${page === p ? 'bg-[#262626] text-white' : 'hover:bg-gray-100'}`}>{p}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Reports ────────────────────────────────────────────────────────────────── */
const REASON_LABELS = {
  spam: 'Spam',
  hate_speech: 'Ngôn từ thù ghét',
  violence: 'Bạo lực',
  nudity: 'Nội dung nhạy cảm',
  misinformation: 'Thông tin sai lệch',
  harassment: 'Quấy rối',
  other: 'Khác',
}

function ReportsTab() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const load = useCallback(async (status = filter) => {
    setLoading(true)
    try {
      const { data } = await adminApi.getReports({ status, limit: 30 })
      setReports(data.data.reports)
    } catch { toast.error('Không thể tải báo cáo') }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [])

  const handleResolve = async (reportId, action) => {
    try {
      await adminApi.resolveReport(reportId, { action })
      toast.success('Đã xử lý báo cáo')
      load()
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  const changeFilter = (f) => { setFilter(f); load(f) }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['pending', 'resolved', 'dismissed'].map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-lg ${filter === f ? 'bg-[#262626] text-white' : 'bg-gray-100 text-[#262626] hover:bg-gray-200'}`}
          >
            {f === 'pending' ? 'Chờ xử lý' : f === 'resolved' ? 'Đã xử lý' : 'Đã bỏ qua'}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-10"><Spinner size={28} /></div> : reports.length === 0 ? (
        <p className="text-center text-[#8e8e8e] py-10">Không có báo cáo nào</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r._id} className="bg-white border border-[#dbdbdb] rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                      {REASON_LABELS[r.reason] || r.reason}
                    </span>
                    <span className="text-xs text-[#8e8e8e]">{timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[#262626] mb-1">
                    <span className="font-semibold">{r.reporter?.username}</span> báo cáo bài viết của{' '}
                    <Link to={`/${r.post?.author?.username}`} className="font-semibold text-[#0095f6]">
                      @{r.post?.author?.username}
                    </Link>
                  </p>
                  {r.description && <p className="text-xs text-[#8e8e8e] italic">"{r.description}"</p>}
                  {r.post && (
                    <Link to={`/p/${r.post._id}`} className="inline-flex items-center gap-1 mt-2">
                      {r.post.media?.[0] && <img src={r.post.media[0].url} alt="" className="w-10 h-10 rounded object-cover" />}
                      <span className="text-xs text-[#0095f6] hover:underline">Xem bài viết</span>
                    </Link>
                  )}
                </div>

                {r.status === 'pending' && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => handleResolve(r._id, 'hide_content')} className="text-xs px-3 py-1.5 bg-orange-100 text-orange-700 font-semibold rounded-lg hover:bg-orange-200">Ẩn bài</button>
                    <button onClick={() => handleResolve(r._id, 'delete_content')} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200">Xóa bài</button>
                    <button onClick={() => handleResolve(r._id, 'dismiss')} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200">Bỏ qua</button>
                  </div>
                )}
                {r.status !== 'pending' && (
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold shrink-0 ${r.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.status === 'resolved' ? 'Đã xử lý' : 'Đã bỏ qua'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Hashtags ───────────────────────────────────────────────────────────────── */
function HashtagsTab() {
  const [hashtags, setHashtags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getHashtags({ limit: 50, sort: '-count' })
      .then(({ data }) => setHashtags(data.data.hashtags))
      .catch(() => toast.error('Không thể tải hashtags'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-10"><Spinner size={28} /></div>

  return (
    <div className="bg-white border border-[#dbdbdb] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-[#dbdbdb]">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">#</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Hashtag</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Số bài viết</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#8e8e8e]">Lần cuối dùng</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#dbdbdb]">
          {hashtags.map((tag, i) => (
            <tr key={tag._id || tag.name}>
              <td className="px-4 py-3 text-[#8e8e8e] text-xs">{i + 1}</td>
              <td className="px-4 py-3">
                <Link to={`/search?q=%23${tag.name}&type=hashtags`} className="font-semibold text-[#0095f6] hover:underline">
                  #{tag.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-[#262626] font-semibold">{formatCount(tag.count)}</td>
              <td className="px-4 py-3 text-[#8e8e8e] text-xs">{tag.lastUsed ? timeAgo(tag.lastUsed) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
