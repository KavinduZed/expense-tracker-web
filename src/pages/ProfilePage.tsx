import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useAuth } from '../auth/useAuth'
import { useUpdateProfile } from '../hooks/useProfile'
import { ApiError } from '../api/client'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'LKR', 'CNY', 'CHF']

interface ProfileForm {
  displayName: string
  currency: string
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const updateProfile = useUpdateProfile()
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    // `values` (not defaultValues) so the form syncs once the session's user loads.
    values: { displayName: user?.displayName ?? '', currency: user?.currency ?? 'USD' },
  })

  async function onSubmit(values: ProfileForm) {
    setStatus(null)
    try {
      const updated = await updateProfile.mutateAsync({
        displayName: values.displayName.trim(),
        currency: values.currency,
      })
      updateUser(updated)
      setStatus({ type: 'success', message: 'Profile updated.' })
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof ApiError ? err.message : 'Could not update your profile.',
      })
    }
  }

  const initials = (user?.displayName ?? '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Box sx={{ maxWidth: 440 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontSize: 18 }}>
              {initials}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 680 }}>{user?.displayName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>

          {status && (
            <Alert severity={status.type} sx={{ mb: 2 }} onClose={() => setStatus(null)}>
              {status.message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              label="Display name"
              fullWidth
              margin="normal"
              error={!!errors.displayName}
              helperText={errors.displayName?.message}
              {...register('displayName', {
                validate: (v) => (v.trim() ? true : 'Display name is required'),
              })}
            />
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <TextField {...field} label="Currency" select fullWidth margin="normal">
                  {CURRENCIES.map((code) => (
                    <MenuItem key={code} value={code}>
                      {code}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button type="submit" variant="contained" disabled={updateProfile.isPending}>
                Save changes
              </Button>
              <Button color="error" onClick={() => void logout()}>
                Log out
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
