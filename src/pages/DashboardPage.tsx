import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '../auth/useAuth'
import { useCurrentBoard } from '../board/useCurrentBoard'
import { useSpendByCategory, useSpendOverTime } from '../hooks/useDashboard'
import { useExpenses } from '../hooks/useExpenses'
import { ApiError } from '../api/client'
import { formatDate, formatMoney } from '../utils/format'
import type { TimeInterval } from '../api/dashboard'

// Harmonious categorical palette (the Ledger design system) assigned by order.
const CATEGORY_COLORS = ['#e0b341', '#e8804f', '#b06fd8', '#4f86e8', '#e85f8a', '#3fb6a8', '#8a9a93']

export default function DashboardPage() {
  const { user } = useAuth()
  const { currentBoard } = useCurrentBoard()
  const theme = useTheme()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [interval, setInterval] = useState<TimeInterval>('day')

  const boardId = currentBoard?.id ?? null
  const range = useMemo(() => ({ from: from || undefined, to: to || undefined }), [from, to])

  const byCategory = useSpendByCategory(boardId, range)
  const overTime = useSpendOverTime(boardId, range, interval)
  const recent = useExpenses(boardId, { page: 1, pageSize: 5, ...range })

  const currency = user?.currency ?? 'USD'
  const total = useMemo(
    () => (byCategory.data ?? []).reduce((sum, c) => sum + c.total, 0),
    [byCategory.data],
  )
  const top = byCategory.data && byCategory.data.length > 0 ? byCategory.data[0] : null

  if (!currentBoard) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography color="text.secondary">
          Select or create a board to see its spending.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            label="From"
            type="date"
            size="small"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      </Box>

      {/* Stat tiles */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' },
          mb: 2,
        }}
      >
        <StatTile label="Total spend" value={formatMoney(total, currency)} />
        <StatTile
          label="Top category"
          value={top ? top.categoryName : '—'}
          sub={top ? formatMoney(top.total, currency) : undefined}
        />
        <StatTile
          label="Transactions"
          value={recent.data ? String(recent.data.totalCount) : '—'}
        />
      </Box>

      {/* Charts */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1.4fr' },
          mb: 2,
        }}
      >
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 650 }}>
              Spend by category
            </Typography>
            <ChartState query={byCategory} empty={total === 0}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ width: 160, height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byCategory.data ?? []}
                        dataKey="total"
                        nameKey="categoryName"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {(byCategory.data ?? []).map((entry, i) => (
                          <Cell key={entry.categoryId} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatMoney(Number(v), currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ flex: 1, minWidth: 140 }}>
                  {(byCategory.data ?? []).map((entry, i) => (
                    <Box
                      key={entry.categoryId}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '3px',
                          bgcolor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                        }}
                      />
                      <Typography variant="body2" sx={{ flex: 1 }} color="text.secondary">
                        {entry.categoryName}
                      </Typography>
                      <Typography variant="body2" className="num" sx={{ fontWeight: 600 }}>
                        {formatMoney(entry.total, currency)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </ChartState>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 650 }}>
                Spend over time
              </Typography>
              <TextField
                select
                size="small"
                value={interval}
                onChange={(e) => setInterval(e.target.value as TimeInterval)}
              >
                <MenuItem value="day">Daily</MenuItem>
                <MenuItem value="week">Weekly</MenuItem>
                <MenuItem value="month">Monthly</MenuItem>
              </TextField>
            </Box>
            <ChartState query={overTime} empty={(overTime.data ?? []).length === 0}>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overTime.data ?? []} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="spendArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="periodStart"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v) => formatMoney(Number(v), currency)}
                      labelFormatter={(l) => formatDate(String(l))}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2.4}
                      fill="url(#spendArea)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </ChartState>
          </CardContent>
        </Card>
      </Box>

      {/* Recent expenses */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 650 }}>
            Recent expenses
          </Typography>
          {recent.isLoading && <CircularProgress size={22} />}
          {recent.data && recent.data.items.length === 0 && (
            <Typography color="text.secondary">No expenses in this range yet.</Typography>
          )}
          {recent.data?.items.map((e) => (
            <Box
              key={e.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {e.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {e.categoryName} · {formatDate(e.date)}
                </Typography>
              </Box>
              <Typography variant="body2" className="num" sx={{ fontWeight: 600 }}>
                {formatMoney(e.amount, currency)}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  )
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 650 }}
        >
          {label}
        </Typography>
        <Typography variant="h5" className="num" sx={{ mt: 0.5, fontWeight: 700 }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="body2" color="text.secondary" className="num">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

// Small wrapper for the loading / error / empty states shared by both charts.
function ChartState({
  query,
  empty,
  children,
}: {
  query: { isLoading: boolean; isError: boolean; error: unknown }
  empty: boolean
  children: React.ReactNode
}) {
  if (query.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }
  if (query.isError) {
    return (
      <Alert severity="error">
        {query.error instanceof ApiError ? query.error.message : 'Could not load this chart.'}
      </Alert>
    )
  }
  if (empty) {
    return (
      <Typography color="text.secondary" sx={{ py: 4 }}>
        No spending in this range yet.
      </Typography>
    )
  }
  return <>{children}</>
}
