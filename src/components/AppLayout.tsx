import { useState, type ReactNode } from 'react'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useAuth } from '../auth/useAuth'
import { useCurrentBoard } from '../board/useCurrentBoard'
import ColorModeToggle from './ColorModeToggle'

const DRAWER_WIDTH = 224

interface NavItem {
  label: string
  to: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: <DashboardOutlinedIcon /> },
  { label: 'Expenses', to: '/expenses', icon: <ReceiptLongOutlinedIcon /> },
  { label: 'Boards', to: '/boards', icon: <DashboardCustomizeOutlinedIcon /> },
  { label: 'Categories', to: '/categories', icon: <CategoryOutlinedIcon /> },
  { label: 'Profile', to: '/profile', icon: <PersonOutlineOutlinedIcon /> },
]

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const drawer = (
    <Box sx={{ px: 1.5, py: 2 }}>
      <Typography variant="h6" sx={{ px: 1.5, mb: 2, fontWeight: 700 }}>
        Expense Tracker
      </Typography>
      <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {navItems.map((item) => {
          const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={active}
              onClick={() => setMobileOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: active ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 550 } } }}>
                {item.label}
              </ListItemText>
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </IconButton>
          <BoardSwitcher />
          <Box sx={{ flexGrow: 1 }} />
          <ColorModeToggle />
          <UserMenu displayName={user?.displayName ?? ''} onLogout={() => void logout()} />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: 'background.default',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )

  function UserMenu({ displayName, onLogout }: { displayName: string; onLogout: () => void }) {
    const [anchor, setAnchor] = useState<null | HTMLElement>(null)
    const navigate = useNavigate()
    return (
      <>
        <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account menu" size="small">
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
            {displayName ? initials(displayName) : '?'}
          </Avatar>
        </IconButton>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
          <MenuItem
            onClick={() => {
              setAnchor(null)
              navigate('/profile')
            }}
          >
            Profile
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              setAnchor(null)
              onLogout()
            }}
          >
            Log out
          </MenuItem>
        </Menu>
      </>
    )
  }
}

function BoardSwitcher() {
  const { boards, currentBoard, setCurrentBoardId, isLoading } = useCurrentBoard()
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()

  const label = isLoading ? 'Loading…' : (currentBoard?.name ?? 'No board')

  return (
    <>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={<ExpandMoreIcon />}
        color="inherit"
        sx={{ fontWeight: 600, textTransform: 'none' }}
        disabled={isLoading || boards.length === 0}
      >
        {label}
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {boards.map((board) => (
          <MenuItem
            key={board.id}
            selected={board.id === currentBoard?.id}
            onClick={() => {
              setCurrentBoardId(board.id)
              setAnchor(null)
            }}
          >
            {board.name}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null)
            navigate('/boards')
          }}
        >
          Manage boards…
        </MenuItem>
      </Menu>
    </>
  )
}
