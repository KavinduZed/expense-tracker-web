import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import { useColorMode } from '../theme/useColorMode'

export default function ColorModeToggle() {
  const { mode, toggle } = useColorMode()
  const goingTo = mode === 'light' ? 'dark' : 'light'

  return (
    <Tooltip title={`Switch to ${goingTo} mode`}>
      <IconButton onClick={toggle} aria-label={`Switch to ${goingTo} mode`} color="inherit">
        {mode === 'light' ? (
          <DarkModeOutlinedIcon fontSize="small" />
        ) : (
          <LightModeOutlinedIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  )
}
