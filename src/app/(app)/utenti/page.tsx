"use client"; // For actions and potential client-side state management

import type { User } from '@/types';
import Image from 'next/image';
import { MoreHorizontal, UserX, KeyRound, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";

// Mock data (replace with Firestore query)
const mockUsers: User[] = [
  { id: 'user1', firstName: 'Giovanni', lastName: 'Bianchi', email: 'gb@example.com', role: 'user', createdAt: new Date(2023, 0, 15).toISOString(), avatarUrl: 'https://placehold.co/40x40.png?text=GB', disabled: false },
  { id: 'user2', firstName: 'Maria', lastName: 'Verdi', email: 'mv@example.com', role: 'user', createdAt: new Date(2023, 1, 20).toISOString(), avatarUrl: 'https://placehold.co/40x40.png?text=MV', disabled: true },
  { id: 'user3', firstName: 'Luca', lastName: 'Neri', email: 'ln@example.com', role: 'user', createdAt: new Date(2023, 2, 10).toISOString(), avatarUrl: 'https://placehold.co/40x40.png?text=LN', disabled: false },
];

export default function UtentiPage() {
  const { toast } = useToast();

  const handleAction = (action: string, userName: string) => {
    toast({
      title: `Azione Eseguita: ${action}`,
      description: `${action} per l'utente ${userName} è stato richiesto. (Funzionalità demo)`,
    });
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">Gestione Utenti</CardTitle>
        <CardDescription>Visualizza e gestisci gli utenti con ruolo "user".</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Cognome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Creato il</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Image
                    src={user.avatarUrl || `https://placehold.co/40x40.png?text=${user.firstName[0]}${user.lastName[0]}`}
                    alt={`${user.firstName} ${user.lastName}`}
                    width={40}
                    height={40}
                    className="rounded-full"
                    data-ai-hint="avatar profile"
                  />
                </TableCell>
                <TableCell className="font-medium">{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString('it-IT')}</TableCell>
                <TableCell>
                  <Badge variant={user.disabled ? 'destructive' : 'default'}>
                    {user.disabled ? 'Disabilitato' : 'Attivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Apri menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleAction('Cambia Password', `${user.firstName} ${user.lastName}`)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Cambia Password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(user.disabled ? 'Abilita Utente' : 'Disabilita Utente', `${user.firstName} ${user.lastName}`)}>
                        <UserX className="mr-2 h-4 w-4" />
                        {user.disabled ? 'Abilita Utente' : 'Disabilita Utente'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleAction('Elimina Utente', `${user.firstName} ${user.lastName}`)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Elimina Utente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
