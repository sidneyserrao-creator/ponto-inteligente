'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Clock,
  Users,
  FileText,
  Megaphone,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import { logout } from '@/lib/actions';
import type { User as UserType } from '@/lib/types';

interface DashboardNavProps {
  user: UserType;
}

const navItems = {
  collaborator: [
    { href: '/dashboard', label: 'Início', icon: Home },
    { href: '/dashboard/ponto', label: 'Registrar Ponto', icon: Clock },
    { href: '/dashboard/documentos', label: 'Meus Documentos', icon: FileText },
  ],
  supervisor: [
    { href: '/dashboard', label: 'Início', icon: Home },
    { href: '/dashboard/equipe', label: 'Minha Equipe', icon: Users },
  ],
  admin: [
    { href: '/dashboard', label: 'Início', icon: Home },
    { href: '/dashboard/anuncios', label: 'Anúncios', icon: Megaphone },
    { href: '/dashboard/documentos', label: 'Documentos', icon: FileText },
  ],
};

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const userInitials = user.name.split(' ').map(n => n[0]).join('');

  const items = navItems[user.role] || [];

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo className="h-8 w-auto text-foreground" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-14 w-full justify-start px-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profilePhotoUrl} alt={user.name} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="ml-3 text-left">
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logout} className="w-full">
                <button type="submit" className="w-full">
                    <DropdownMenuItem>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                    </DropdownMenuItem>
                </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
