import { Home, CalendarDays, Brain, Mic, FileText, BookOpen, Users, User, Settings, Building, Briefcase, AlertTriangle, Award, Calendar, ChevronDown, Trophy, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'Quizzes', url: '/dashboard/quizzes', icon: Brain },
  { title: 'Leaderboard', url: '/dashboard/leaderboard', icon: Trophy },
  { title: 'Resume', url: '/dashboard/resume', icon: FileText },
  { title: 'Knowledge Vault', url: '/dashboard/vault', icon: BookOpen },
  { title: 'Companies', url: '/dashboard/companies', icon: Building },
  { title: 'Jobs', url: '/dashboard/jobs', icon: Briefcase },
  { title: 'Social Hub', url: '/dashboard/social', icon: Users },
  { title: 'Profile', url: '/dashboard/profile', icon: User },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
];

const dashboardGroup = {
  title: 'Dashboard',
  icon: CalendarDays,
  items: [
    { title: 'Weekly Plan', url: '/dashboard/weekly' },
    { title: 'Readiness Score', url: '/dashboard/readiness' },
    { title: 'Weakness Detector', url: '/dashboard/weakness' },
    { title: 'Last 7 Days', url: '/dashboard/last-7-days' },
  ],
};

const interviewGroup = {
  title: 'Interview',
  icon: Mic,
  items: [
    { title: 'Interview Prep', url: '/dashboard/interview' },
    { title: 'Mock Interview', url: '/dashboard/mock-interview' },
    { title: 'Speech Practice', url: '/dashboard/speech' },
    { title: 'Company Prep', url: '/dashboard/company-prep' },
  ],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState({ dashboard: false, interview: false });
  const { domain } = useStationStore();
  const config = domainConfig[domain];

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const isInterviewPath = interviewGroup.items.some(
      (item) => location.pathname === item.url || location.pathname.startsWith(item.url),
    );
    const isDashboardPath = dashboardGroup.items.some(
      (item) => location.pathname === item.url || location.pathname.startsWith(item.url),
    );

    setExpandedGroups((current) => ({
      dashboard: current.dashboard || isDashboardPath,
      interview: current.interview || isInterviewPath,
    }));
  }, [location.pathname]);

  const toggleGroup = (group: keyof typeof expandedGroups) => {
    setExpandedGroups((current) => ({ ...current, [group]: !current[group] }));
  };

  const dashboardActive = dashboardGroup.items.some((item) => location.pathname === item.url || location.pathname.startsWith(item.url));
  const interviewActive = interviewGroup.items.some((item) => location.pathname === item.url || location.pathname.startsWith(item.url));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (
              <span className="flex items-center gap-2">
                <img src="/logo.svg" alt="Station logo" className="h-8 w-8 rounded-md border border-border bg-background" />
                <span className="font-bold text-sidebar-primary">STATION</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-primary/20 text-sidebar-primary font-medium">{config.tag}</span>
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.slice(0, 2).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/dashboard'} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  onClick={() => toggleGroup('dashboard')}
                  isActive={dashboardActive}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <dashboardGroup.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{dashboardGroup.title}</span>}
                  </span>
                  {!collapsed && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        expandedGroups.dashboard ? 'rotate-180' : 'rotate-0',
                      )}
                    />
                  )}
                </SidebarMenuButton>

                {!collapsed && expandedGroups.dashboard && (
                  <SidebarMenuSub>
                    {dashboardGroup.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={location.pathname === item.url}>
                          <NavLink
                            to={item.url}
                            end
                            className="flex-1"
                            activeClassName="font-medium"
                          >
                            {item.title}
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  onClick={() => toggleGroup('interview')}
                  isActive={interviewActive}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <interviewGroup.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{interviewGroup.title}</span>}
                  </span>
                  {!collapsed && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        expandedGroups.interview ? 'rotate-180' : 'rotate-0',
                      )}
                    />
                  )}
                </SidebarMenuButton>

                {!collapsed && expandedGroups.interview && (
                  <SidebarMenuSub>
                    {interviewGroup.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={location.pathname === item.url}>
                          <NavLink
                            to={item.url}
                            end
                            className="flex-1"
                            activeClassName="font-medium"
                          >
                            {item.title}
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {navItems.slice(2).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/dashboard'} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
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
