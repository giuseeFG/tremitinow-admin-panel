
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
// import { Checkbox } from '@/components/ui/checkbox'; // Checkbox not used in current mock
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from 'react';
// import { apiClient } from '@/lib/graphql/client'; // Placeholder for API client
// import { GET_USERS_BY_ROLE_QUERY } from '@/lib/graphql/queries'; // Placeholder for GraphQL query

// Mock data (replace with API call)
const mockUsers: User[] = [
  { id: 1, firebaseId: 'user1', first_name: 'Giovanni', last_name: 'Bianchi', email: 'gb@example.com', role: 'user', created_at: new Date(2023, 0, 15).toISOString(), avatar: 'https://placehold.co/40x40.png?text=GB', status: 'active', disabled: false, displayName: 'Giovanni Bianchi' },
  { id: 2, firebaseId: 'user2', first_name: 'Maria', last_name: 'Verdi', email: 'mv@example.com', role: 'user', created_at: new Date(2023, 1, 20).toISOString(), avatar: 'https://placehold.co/40x40.png?text=MV', status: 'disabled', disabled: true, displayName: 'Maria Verdi' },
  { id: 3, firebaseId: 'user3', first_name: 'Luca', last_name: 'Neri', email: 'ln@example.com', role: 'user', created_at: new Date(2023, 2, 10).toISOString(), avatar: 'https://placehold.co/40x40.png?text=LN', status: 'active', disabled: false, displayName: 'Luca Neri' },
];

export default function UtentiPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(mockUsers); // Initialize with mock data
  const [loading, setLoading] = useState(false); // To manage loading state for API calls

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     setLoading(true);
  //     try {
  //       // TODO: Replace with actual API call
  //       // const response = await apiClient<{ users: User[] }>(GET_USERS_BY_ROLE_QUERY, { role: 'user' });
  //       // if (response.data && response.data.users) {
  //       //   const fetchedUsers = response.data.users.map(u => ({
  //       //     ...u,
  //       //     disabled: u.status === 'disabled',
  //       //     displayName: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
  //       //     // Ensure avatar has a fallback
  //       //     avatar: u.avatar || `https://placehold.co/40x40.png?text=${(u.first_name || 'U')[0]}${(u.last_name || 'N')[0]}`
  //       //   }));
  //       //   setUsers(fetchedUsers);
  //       // } else if (response.errors) {
  //       //   console.error("GraphQL errors:", response.errors);
  //       //   toast({ title: "Errore", description: "Impossibile caricare gli utenti.", variant: "destructive" });
  //       //   setUsers(mockUsers); // Fallback to mock data on error
  //       // }
  //       setUsers(mockUsers); // Using mock data for now
  //     } catch (error) {
  //       console.error("Failed to fetch users:", error);
  //       toast({ title: "Errore", description: "Impossibile caricare gli utenti.", variant: "destructive" });
  //       setUsers(mockUsers); // Fallback to mock data on error
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchUsers();
  // }, [toast]);


  const handleAction = (action: string, userName: string) => {
    toast({
      title: `Azione Eseguita: ${action}`,
      description: `${action} per l'utente ${userName} è stato richiesto. (Funzionalità demo)`,
    });
  };
  
  if (loading && users.length === 0) { // Show loading only if there's no data yet
    return <div className="flex justify-center items-center h-64">Caricamento utenti...</div>;
  }

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
            {users.map((user) => (
              <TableRow key={user.id}> {/* Using DB id as key */}
                <TableCell>
                  <Image
                    src={user.avatar || `https://placehold.co/40x40.png?text=${(user.first_name || 'U')[0]}${(user.last_name || 'N')[0]}`}
                    alt={`${user.first_name || ''} ${user.last_name || ''}`}
                    width={40}
                    height={40}
                    className="rounded-full"
                    data-ai-hint="avatar profile"
                  />
                </TableCell>
                <TableCell className="font-medium">{user.first_name}</TableCell>
                <TableCell>{user.last_name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>{new Date(user.created_at || Date.now()).toLocaleDateString('it-IT')}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleAction('Cambia Password', `${user.first_name} ${user.last_name}`)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Cambia Password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(user.disabled ? 'Abilita Utente' : 'Disabilita Utente', `${user.first_name} ${user.last_name}`)}>
                        <UserX className="mr-2 h-4 w-4" />
                        {user.disabled ? 'Abilita Utente' : 'Disabilita Utente'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleAction('Elimina Utente', `${user.first_name} ${user.last_name}`)}>
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
         {users.length === 0 && !loading && (
          <p className="text-center py-4 text-muted-foreground">Nessun utente trovato.</p>
        )}
      </CardContent>
    </Card>
  );
}
