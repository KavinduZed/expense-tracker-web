import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { useAuth } from '../auth/useAuth'
import { useCurrentBoard } from '../board/useCurrentBoard'
import { useCategories } from '../hooks/useCategories'
import { useCreateExpense, useDeleteExpense, useExpenses, useUpdateExpense } from '../hooks/useExpenses'
import { ApiError } from '../api/client'
import { formatDate, formatMoney } from '../utils/format'
import type { ExpenseDto } from '../types/api'

const PAGE_SIZE = 10

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function ExpensesPage() {
  const { currentBoard } = useCurrentBoard()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<{ mode: 'new' } | { mode: 'edit'; expense: ExpenseDto } | null>(
    null,
  )

  const boardId = currentBoard?.id ?? null
  const filters = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      categoryId: categoryId === '' ? undefined : categoryId,
      page,
      pageSize: PAGE_SIZE,
    }),
    [from, to, categoryId, page],
  )

  const { data, isLoading, isError, error } = useExpenses(boardId, filters)
  const { data: categories } = useCategories()

  if (!currentBoard) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Expenses
        </Typography>
        <Typography color="text.secondary">
          Select or create a board to start tracking expenses.
        </Typography>
      </Box>
    )
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1

  function resetPageThen(fn: () => void) {
    setPage(1)
    fn()
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Expenses
        </Typography>
        <Button variant="contained" onClick={() => setDialog({ mode: 'new' })}>
          Add expense
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
        <TextField
          label="From"
          type="date"
          size="small"
          value={from}
          onChange={(e) => resetPageThen(() => setFrom(e.target.value))}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          value={to}
          onChange={(e) => resetPageThen(() => setTo(e.target.value))}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Category"
          select
          size="small"
          value={categoryId}
          onChange={(e) =>
            resetPageThen(() => setCategoryId(e.target.value === '' ? '' : Number(e.target.value)))
          }
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All categories</MenuItem>
          {categories?.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        {(from || to || categoryId !== '') && (
          <Button
            size="small"
            onClick={() => resetPageThen(() => {
              setFrom('')
              setTo('')
              setCategoryId('')
            })}
          >
            Clear
          </Button>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          {error instanceof ApiError ? error.message : 'Could not load expenses.'}
        </Alert>
      )}

      {data && data.items.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 4 }}>
          No expenses yet{from || to || categoryId !== '' ? ' for this filter' : ''}. Add your first
          one.
        </Typography>
      )}

      {data && data.items.length > 0 && (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    boardId={currentBoard.id}
                    onEdit={() => setDialog({ mode: 'edit', expense })}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {data.totalCount} {data.totalCount === 1 ? 'expense' : 'expenses'}
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              size="small"
            />
          </Box>
        </>
      )}

      {dialog && (
        <ExpenseDialog
          boardId={currentBoard.id}
          expense={dialog.mode === 'edit' ? dialog.expense : null}
          onClose={() => setDialog(null)}
        />
      )}
    </Box>
  )
}

function ExpenseRow({
  expense,
  boardId,
  onEdit,
}: {
  expense: ExpenseDto
  boardId: string
  onEdit: () => void
}) {
  const { user } = useAuth()
  const deleteExpense = useDeleteExpense(boardId)
  const currency = user?.currency ?? 'USD'

  return (
    <TableRow hover>
      <TableCell>{expense.name}</TableCell>
      <TableCell>
        <Chip size="small" label={expense.categoryName} variant="outlined" />
      </TableCell>
      <TableCell className="num">{formatDate(expense.date)}</TableCell>
      <TableCell align="right" className="num" sx={{ fontWeight: 600 }}>
        {formatMoney(expense.amount, currency)}
      </TableCell>
      <TableCell align="right">
        <IconButton size="small" aria-label={`Edit ${expense.name}`} onClick={onEdit}>
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          aria-label={`Delete ${expense.name}`}
          disabled={deleteExpense.isPending}
          onClick={() => {
            if (window.confirm(`Delete "${expense.name}"?`)) deleteExpense.mutate(expense.id)
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  )
}

interface ExpenseForm {
  name: string
  amount: string
  categoryId: number | ''
  date: string
  description: string
}

function ExpenseDialog({
  boardId,
  expense,
  onClose,
}: {
  boardId: string
  expense: ExpenseDto | null
  onClose: () => void
}) {
  const { data: categories } = useCategories()
  const createExpense = useCreateExpense(boardId)
  const updateExpense = useUpdateExpense(boardId)
  const [formError, setFormError] = useState<string | null>(null)
  const isEdit = !!expense
  const pending = createExpense.isPending || updateExpense.isPending

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseForm>({
    defaultValues: {
      name: expense?.name ?? '',
      amount: expense ? String(expense.amount) : '',
      categoryId: expense?.categoryId ?? '',
      date: expense?.date ?? today(),
      description: expense?.description ?? '',
    },
  })

  async function onSubmit(values: ExpenseForm) {
    setFormError(null)
    const input = {
      name: values.name.trim(),
      amount: Number(values.amount),
      categoryId: Number(values.categoryId),
      date: values.date,
      description: values.description.trim() || undefined,
    }
    try {
      if (isEdit) {
        await updateExpense.mutateAsync({ id: expense.id, ...input })
      } else {
        await createExpense.mutateAsync(input)
      }
      onClose()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not save the expense.')
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>{isEdit ? 'Edit expense' : 'Add expense'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <TextField
            autoFocus
            label="Name"
            fullWidth
            margin="dense"
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register('name', { validate: (v) => (v.trim() ? true : 'Name is required') })}
          />
          <TextField
            label="Amount"
            type="number"
            fullWidth
            margin="dense"
            slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
            error={!!errors.amount}
            helperText={errors.amount?.message}
            {...register('amount', {
              validate: (v) => (Number(v) > 0 ? true : 'Amount must be greater than 0'),
            })}
          />
          <Controller
            control={control}
            name="categoryId"
            rules={{ validate: (v) => (v !== '' ? true : 'Pick a category') }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Category"
                select
                fullWidth
                margin="dense"
                error={!!errors.categoryId}
                helperText={errors.categoryId?.message}
              >
                {categories?.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="dense"
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.date}
            helperText={errors.date?.message}
            {...register('date', { required: 'Date is required' })}
          />
          <TextField
            label="Description (optional)"
            fullWidth
            margin="dense"
            multiline
            {...register('description')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {isEdit ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
