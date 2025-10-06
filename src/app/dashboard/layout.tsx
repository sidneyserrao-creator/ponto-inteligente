
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/actions';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User, Role } from '@/lib/types';


const getRoleName = (role: Role) => {
    switch (role) {
        case 'admin': return 'Administrador';
        case 'supervisor': return 'Supervisor';
        case 'collaborator': return 'Colaborador';
        default: return role;
    }
}

function UserProfile({ user }: { user: User }) {
    const userInitials = user.name.split(' ').map(n => n[0]).join('');
    return (
        <div className="flex items-center gap-4">
             <Avatar className="h-10 w-10 border">
                <AvatarImage src={user.profilePhotoUrl} alt={user.name} className="object-cover" />
                <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="text-left">
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{getRoleName(user.role)}</p>
            </div>
        </div>
    )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between p-4">
                <div className="flex items-center gap-6">
                    <UserProfile user={user} />
                </div>
                <form action={logout}>
                    <Button variant="outline" size="sm">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                    </Button>
                </form>
            </div>
        </header>
        <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
  );
}
