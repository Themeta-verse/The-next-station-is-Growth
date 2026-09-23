import {
  Home,
  CalendarDays,
  Brain,
  Mic,
  FileText,
  BookOpen,
  Users,
  User,
  Settings,
  Building,
  Briefcase,
  Award,
  Trophy,
  LogOut,
  TrendingUp,
  Video,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useNavigate } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { useAuth } from '@/context/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const coreNav = [
  { title: 'Home', url: '/dashboard', icon: Home, end: true },
  { title: 'Growth Insights', url: '/dashboard/growth-insights', icon: TrendingUp },
  { title: 'Readiness Score', url: '/dashboard/readiness', icon: Award },
  { title: 'Weekly Plan', url: '/dashboard/weekly', icon: CalendarDays },
  { title: 'Skill Quizzes', url: '/dashboard/quizzes', icon: Brain },
  { title: 'Leaderboard', url: '/dashboard/leaderboard', icon: Trophy },
];

const interviewNav = [
  { title: 'Live AI Interview', url: '/dashboard/mock-interview', icon: Video },
  { title: 'Interview Prep', url: '/dashboard/interview', icon: Brain },
  { title: 'Speech Practice', url: '/dashboard/speech', icon: Mic },
  { title: 'Company Mock', url: '/dashboard/company-prep', icon: Building },
];

const careerNav = [
  { title: 'Job Openings', url: '/dashboard/jobs', icon: Briefcase },
  { title: 'Top Companies', url: '/dashboard/companies', icon: Building },
  { title: 'Resume Builder', url: '/dashboard/resume', icon: FileText },
  { title: 'Knowledge Vault', url: '/dashboard/vault', icon: BookOpen },
  { title: 'Peer Network', url: '/dashboard/social', icon: Users },
  { title: 'Profile', url: '/dashboard/profile', icon: User },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { domain } = useStationStore();
  const config = domainConfig[domain];

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand Header */}
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (
              <span className="flex items-center gap-2">
                <img
                  src="/logo.svg"
                  alt="Station logo"
                  className="h-8 w-8 rounded-md border border-border bg-background"
                />
                <span className="font-bold tracking-tight text-sidebar-primary">GROWTH STATION</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-primary/20 text-sidebar-primary font-medium">
                  {config.tag}
                </span>
              </span>
            )}
          </SidebarGroupLabel>
        </SidebarGroup>

        {/* CORE SECTION */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-mono tracking-wider font-semibold text-muted-foreground uppercase px-2">
            {!collapsed ? 'Core Intelligence' : 'Core'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* INTERVIEW SECTION */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-mono tracking-wider font-semibold text-muted-foreground uppercase px-2">
            {!collapsed ? 'Interview Systems' : 'Interview'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {interviewNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* CAREER SECTION */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-mono tracking-wider font-semibold text-muted-foreground uppercase px-2">
            {!collapsed ? 'Career & Network' : 'Career'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {careerNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {!collapsed ? (
          <div className="p-3 space-y-2 border-t border-sidebar-border">
            <ThemeSwitcher />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <div className="p-2 flex flex-col items-center gap-2 border-t border-sidebar-border">
            <button
              type="button"
              onClick={handleLogout}
              title="Log Out"
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
