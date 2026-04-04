// Custom components
export { ThemeProvider } from './ThemeProvider';
export { ThemeToggle } from './ThemeToggle';
export { LanguageToggle } from './LanguageToggle';

// Layout components
export { AppShell } from './layout';

// Header components
export { Header, Logo, UserAvatar } from './header';

// Navigation components
export { NavItem, MobileBottomNav, DesktopSideNav, NAV_ITEMS } from './navigation';
export type { NavItemType } from './navigation';

// UI components
export { Button } from './ui/button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
export { Input } from './ui/input';
export { Label } from './ui/label';
export { Separator } from './ui/separator';
export { Textarea } from './ui/textarea';
export { Badge } from './ui/badge';
export type { BadgeProps } from './ui/badge';
export { Avatar } from './ui/avatar';
export type { AvatarProps } from './ui/avatar';
export {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './ui/dialog';
export { ToastProvider, Toaster, toast, toastManager } from './ui/toast';
export { Spinner } from './ui/spinner';
export type { SpinnerProps } from './ui/spinner';
export { EmptyState } from './ui/empty-state';
export type { EmptyStateProps } from './ui/empty-state';
