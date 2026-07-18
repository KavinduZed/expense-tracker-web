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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../hooks/useCategories'
import { ApiError } from '../api/client'
import type { CategoryDto } from '../types/api'

export default function CategoriesPage() {
  const { data: categories, isLoading, isError, error } = useCategories()
  const [editing, setEditing] = useState<CategoryDto | 'new' | null>(null)
  const deleteCategory = useDeleteCategory()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function onDelete(category: CategoryDto) {
    setDeleteError(null)
    if (!window.confirm(`Delete category "${category.name}"?`)) return
    deleteCategory.mutate(category.id, {
      onError: (err) =>
        setDeleteError(
          err instanceof ApiError && err.status === 409
            ? `"${category.name}" is used by existing expenses and can't be deleted.`
            : err instanceof ApiError
              ? err.message
              : 'Could not delete the category.',
        ),
    })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Categories
        </Typography>
        <Button variant="contained" onClick={() => setEditing('new')}>
          New category
        </Button>
      </Box>

      {deleteError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>
          {deleteError}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          {error instanceof ApiError ? error.message : 'Could not load categories.'}
        </Alert>
      )}

      {categories && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          }}
        >
          {categories.map((category) => (
            <Card key={category.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    {category.icon ? `${category.icon} ` : ''}
                    {category.name}
                  </Typography>
                  {category.isDefault && <Chip size="small" label="Default" variant="outlined" />}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button size="small" onClick={() => setEditing(category)}>
                    Edit
                  </Button>
                  <Button size="small" color="error" onClick={() => onDelete(category)}>
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {editing && (
        <CategoryDialog
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Box>
  )
}

interface CategoryForm {
  name: string
  icon: string
}

function CategoryDialog({
  category,
  onClose,
}: {
  category: CategoryDto | null
  onClose: () => void
}) {
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryForm>({
    defaultValues: { name: category?.name ?? '', icon: category?.icon ?? '' },
  })

  const isEdit = !!category
  const pending = createCategory.isPending || updateCategory.isPending

  async function onSubmit(values: CategoryForm) {
    setFormError(null)
    const input = { name: values.name.trim(), icon: values.icon.trim() || undefined }
    try {
      if (isEdit) {
        await updateCategory.mutateAsync({ id: category.id, ...input })
      } else {
        await createCategory.mutateAsync(input)
      }
      onClose()
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 409
          ? 'A category with that name already exists.'
          : err instanceof ApiError
            ? err.message
            : 'Could not save the category.',
      )
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>{isEdit ? 'Edit category' : 'New category'}</DialogTitle>
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
            label="Icon (optional)"
            fullWidth
            margin="dense"
            placeholder="e.g. 🍔"
            {...register('icon')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
