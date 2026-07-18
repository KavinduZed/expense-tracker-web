import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useAuth } from '../auth/useAuth'
import { validateDisplayName, validateEmail, validatePassword } from '../auth/validation'
import { ApiError } from '../api/client'
import ColorModeToggle from '../components/ColorModeToggle'

interface SignUpForm {
  displayName: string
  email: string
  password: string
}

export default function SignUpPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({ defaultValues: { displayName: '', email: '', password: '' } })

  async function onSubmit(values: SignUpForm) {
    setFormError(null)
    try {
      await registerUser(values.email, values.password, values.displayName)
      navigate('/', { replace: true })
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 409
          ? 'An account with this email already exists.'
          : err instanceof ApiError
            ? err.message
            : 'Something went wrong. Please try again.',
      )
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <ColorModeToggle />
      </Box>
      <Paper sx={{ p: 4 }} elevation={2}>
        <Typography variant="h5" component="h1" gutterBottom>
          Create your account
        </Typography>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label="Display name"
            fullWidth
            margin="normal"
            autoComplete="name"
            error={!!errors.displayName}
            helperText={errors.displayName?.message}
            {...register('displayName', { validate: validateDisplayName })}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email', { validate: validateEmail })}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            autoComplete="new-password"
            error={!!errors.password}
            helperText={
              errors.password?.message ??
              'At least 8 characters, with a number, an uppercase letter, and a symbol.'
            }
            {...register('password', { validate: validatePassword })}
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Sign up'}
          </Button>
        </Box>
        <Typography variant="body2" sx={{ mt: 3 }}>
          Already have an account?{' '}
          <Link component={RouterLink} to="/login">
            Sign in
          </Link>
        </Typography>
      </Paper>
    </Container>
  )
}
