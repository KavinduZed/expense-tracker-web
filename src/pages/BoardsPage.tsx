import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import {
  useAddMember,
  useBoardMembers,
  useBoards,
  useCreateBoard,
  useDeleteBoard,
  useRemoveMember,
} from '../hooks/useBoards'
import { validateEmail } from '../auth/validation'
import { ApiError } from '../api/client'
import type { BoardDto } from '../types/api'

export default function BoardsPage() {
  const { data: boards, isLoading, isError, error } = useBoards()
  const [createOpen, setCreateOpen] = useState(false)
  const [manageBoard, setManageBoard] = useState<BoardDto | null>(null)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Boards
        </Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          New board
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          {error instanceof ApiError ? error.message : 'Could not load your boards.'}
        </Alert>
      )}

      {boards && boards.length === 0 && (
        <Typography color="text.secondary">
          You don&apos;t have any boards yet. Create one to start tracking expenses.
        </Typography>
      )}

      {boards && boards.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          }}
        >
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} onManage={() => setManageBoard(board)} />
          ))}
        </Box>
      )}

      <CreateBoardDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {manageBoard && (
        <MembersDialog board={manageBoard} onClose={() => setManageBoard(null)} />
      )}
    </Box>
  )
}

function BoardCard({ board, onManage }: { board: BoardDto; onManage: () => void }) {
  const deleteBoard = useDeleteBoard()
  const isOwner = board.role === 'Owner'

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6">{board.name}</Typography>
          <Chip
            size="small"
            label={board.role}
            color={isOwner ? 'primary' : 'default'}
            variant={isOwner ? 'filled' : 'outlined'}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {board.memberCount} {board.memberCount === 1 ? 'member' : 'members'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button size="small" onClick={onManage}>
            {isOwner ? 'Manage members' : 'View members'}
          </Button>
          {isOwner && (
            <Button
              size="small"
              color="error"
              disabled={deleteBoard.isPending}
              onClick={() => {
                if (window.confirm(`Delete board "${board.name}"? This can't be undone.`)) {
                  deleteBoard.mutate(board.id)
                }
              }}
            >
              Delete
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

interface CreateForm {
  name: string
}

function CreateBoardDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createBoard = useCreateBoard()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({ defaultValues: { name: '' } })

  function close() {
    reset()
    setFormError(null)
    onClose()
  }

  async function onSubmit(values: CreateForm) {
    setFormError(null)
    try {
      await createBoard.mutateAsync(values.name.trim())
      close()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create the board.')
    }
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>New board</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <TextField
            autoFocus
            label="Board name"
            fullWidth
            margin="dense"
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register('name', {
              validate: (v) => (v.trim() ? true : 'Name is required'),
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={createBoard.isPending}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

interface AddMemberForm {
  email: string
}

function MembersDialog({ board, onClose }: { board: BoardDto; onClose: () => void }) {
  const { data: members, isLoading } = useBoardMembers(board.id)
  const addMember = useAddMember(board.id)
  const removeMember = useRemoveMember(board.id)
  const isOwner = board.role === 'Owner'
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddMemberForm>({ defaultValues: { email: '' } })

  async function onAdd(values: AddMemberForm) {
    setFormError(null)
    try {
      await addMember.mutateAsync(values.email.trim())
      reset()
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 404
          ? 'No account found with that email.'
          : err instanceof ApiError && err.status === 409
            ? 'That person is already a member.'
            : err instanceof ApiError
              ? err.message
              : 'Could not add the member.',
      )
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{board.name} · members</DialogTitle>
      <DialogContent>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <List dense>
          {members?.map((m) => (
            <ListItem
              key={m.userId}
              disableGutters
              secondaryAction={
                isOwner && m.role !== 'Owner' ? (
                  <IconButton
                    edge="end"
                    aria-label={`Remove ${m.displayName}`}
                    disabled={removeMember.isPending}
                    onClick={() => removeMember.mutate(m.userId)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                ) : null
              }
            >
              <ListItemText
                primary={m.displayName}
                secondary={`${m.email} · ${m.role}`}
              />
            </ListItem>
          ))}
        </List>

        {isOwner && (
          <Box component="form" onSubmit={handleSubmit(onAdd)} noValidate sx={{ mt: 1 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {formError}
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                label="Invite by email"
                size="small"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email', { validate: validateEmail })}
              />
              <Button type="submit" variant="contained" disabled={addMember.isPending} sx={{ mt: 0.25 }}>
                Add
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
