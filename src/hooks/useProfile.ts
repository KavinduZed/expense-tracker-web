import { useMutation } from '@tanstack/react-query'
import * as profileApi from '../api/profile'

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (input: { displayName: string; currency: string }) =>
      profileApi.updateProfile(input),
  })
}
