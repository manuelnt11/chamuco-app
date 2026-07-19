import { type ReactNode } from 'react';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup and reset mocks after each test case
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ children }: { children: ReactNode }) => children,
  I18nextProvider: ({ children }: { children: ReactNode }) => children,
  initReactI18next: { type: '3rdParty' as const, init: () => {} },
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    systemTheme: 'light',
    themes: ['light', 'dark'],
  }),
}));

// Mock @/components/ui/toast — use vi.mocked(toast.success/error/info) in tests for assertions
vi.mock('@/components/ui/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

// Mock @phosphor-icons/react — all icons render null; per-file overrides keep specific testid assertions
vi.mock('@phosphor-icons/react', () => ({
  AirplaneIcon: (props: Record<string, unknown>) => <svg {...props} />,
  AirplaneLandingIcon: (props: Record<string, unknown>) => <svg {...props} />,
  AirplaneTakeoffIcon: (props: Record<string, unknown>) => <svg {...props} />,
  AirplaneTiltIcon: (props: Record<string, unknown>) => <svg {...props} />,
  ArrowDownIcon: (props: Record<string, unknown>) => <svg {...props} />,
  ArrowLeftIcon: (props: Record<string, unknown>) => <svg {...props} />,
  ArrowRightIcon: (props: Record<string, unknown>) => <svg {...props} />,
  BellIcon: (props: Record<string, unknown>) => <svg {...props} />,
  CalendarBlankIcon: (props: Record<string, unknown>) => <svg {...props} />,
  CaretDownIcon: (props: Record<string, unknown>) => <svg {...props} />,
  CaretLeftIcon: (props: Record<string, unknown>) => <svg {...props} />,
  CaretRightIcon: (props: Record<string, unknown>) => <svg {...props} />,
  CaretUpDownIcon: (props: Record<string, unknown>) => <svg {...props} />,
  ChatCircleIcon: (props: Record<string, unknown>) => <svg {...props} />,
  CheckCircleIcon: (props: Record<string, unknown>) => <svg {...props} />,
  CheckFatIcon: (props: Record<string, unknown>) => <svg {...props} />,
  CheckIcon: (props: Record<string, unknown>) => <svg {...props} />,
  CodeIcon: (props: Record<string, unknown>) => <svg {...props} />,
  CompassIcon: (props: Record<string, unknown>) => <svg {...props} />,
  CopyIcon: (props: Record<string, unknown>) => <svg {...props} />,
  DesktopIcon: (props: Record<string, unknown>) => <svg {...props} />,
  DotsSixVerticalIcon: (props: Record<string, unknown>) => <svg {...props} />,
  DownloadSimpleIcon: (props: Record<string, unknown>) => <svg {...props} />,
  GearSixIcon: (props: Record<string, unknown>) => <svg {...props} />,
  GlobeIcon: (props: Record<string, unknown>) => <svg {...props} />,
  HouseIcon: (props: Record<string, unknown>) => <svg {...props} />,
  IdentificationCardIcon: (props: Record<string, unknown>) => <svg {...props} />,
  InfoIcon: (props: Record<string, unknown>) => <svg {...props} />,
  LinkIcon: (props: Record<string, unknown>) => <svg {...props} />,
  ListBulletsIcon: (props: Record<string, unknown>) => <svg {...props} />,
  ListNumbersIcon: (props: Record<string, unknown>) => <svg {...props} />,
  MagnifyingGlassIcon: (props: Record<string, unknown>) => <svg {...props} />,
  MegaphoneIcon: (props: Record<string, unknown>) => <svg {...props} />,
  MoonIcon: (props: Record<string, unknown>) => <svg {...props} />,
  NavigationArrowIcon: (props: Record<string, unknown>) => <svg {...props} />,
  PaperPlaneTiltIcon: (props: Record<string, unknown>) => <svg {...props} />,
  PencilSimpleIcon: (props: Record<string, unknown>) => <svg {...props} />,
  PlusIcon: (props: Record<string, unknown>) => <svg {...props} />,
  ProhibitIcon: (props: Record<string, unknown>) => <svg {...props} />,
  QuestionMarkIcon: (props: Record<string, unknown>) => <svg {...props} />,
  QuotesIcon: (props: Record<string, unknown>) => <svg {...props} />,
  ShareNetworkIcon: (props: Record<string, unknown>) => <svg {...props} />,
  ShieldStarIcon: (props: Record<string, unknown>) => <svg {...props} />,
  SignOutIcon: (props: Record<string, unknown>) => <svg {...props} />,
  SmileyIcon: (props: Record<string, unknown>) => <svg {...props} />,
  SunDimIcon: (props: Record<string, unknown>) => <svg {...props} />,
  TableIcon: (props: Record<string, unknown>) => <svg {...props} />,
  TextBIcon: (props: Record<string, unknown>) => <svg {...props} />,
  TextHOneIcon: (props: Record<string, unknown>) => <svg {...props} />,
  TextHThreeIcon: (props: Record<string, unknown>) => <svg {...props} />,
  TextHTwoIcon: (props: Record<string, unknown>) => <svg {...props} />,
  TextItalicIcon: (props: Record<string, unknown>) => <svg {...props} />,
  TranslateIcon: (props: Record<string, unknown>) => <svg {...props} />,
  TrashIcon: (props: Record<string, unknown>) => <svg {...props} />,
  TrophyIcon: (props: Record<string, unknown>) => <svg {...props} />,
  UploadSimpleIcon: (props: Record<string, unknown>) => <svg {...props} />,
  UserCheckIcon: (props: Record<string, unknown>) => <svg {...props} />,
  UserCircleIcon: (props: Record<string, unknown>) => <svg {...props} />,
  UserIcon: (props: Record<string, unknown>) => <svg {...props} />,
  UserMinusIcon: (props: Record<string, unknown>) => <svg {...props} />,
  UserPlusIcon: (props: Record<string, unknown>) => <svg {...props} />,
  UsersIcon: (props: Record<string, unknown>) => <svg {...props} />,
  UsersThreeIcon: (props: Record<string, unknown>) => <svg {...props} />,
  WarningCircleIcon: (props: Record<string, unknown>) => <svg {...props} />,
  WarningIcon: (props: Record<string, unknown>) => <svg {...props} />,
  WifiSlashIcon: (props: Record<string, unknown>) => <svg {...props} />,
  XCircleIcon: (props: Record<string, unknown>) => <svg {...props} />,
  XIcon: (props: Record<string, unknown>) => <svg {...props} />,
}));

// Mock next/link — renders as a plain <a> so href/className are testable
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
