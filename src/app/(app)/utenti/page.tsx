
"use client"; // For actions and potential client-side state management

import type { User } from '@/types';
import Image from 'next/image';
import { MoreHorizontal, UserX, KeyRound, Trash2, Loader2 } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/graphql/client';
import { GET_USERS_BY_ROLE_QUERY } from '@/lib/graphql/queries';
import { parseImg } from '@/lib/utils';


export default function UtentiPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]); 
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // TODO: Ensure apiClient is configured and handles authentication for this query
        const response = await apiClient<{ users: any[] }>(GET_USERS_BY_ROLE_QUERY, { role: 'user' });
        if (response.data && response.data.users) {
          const fetchedUsers: User[] = response.data.users.map(u => ({
            ...u, // spread all fields from query
            id: parseInt(u.id, 10), // ensure id is number
            disabled: u.status === 'disabled',
            displayName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            // avatar is handled by parseImg later
          }));
          setUsers(fetchedUsers);
        } else if (response.errors) {
          console.error("GraphQL errors:", response.errors);
          toast({ title: "Errore", description: `Impossibile caricare gli utenti: ${response.errors[0].message}`, variant: "destructive" });
        } else {
          toast({ title: "Errore", description: "Nessun dato utente ricevuto.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({ title: "Errore", description: "Impossibile connettersi al server per caricare gli utenti.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);


  const handleAction = (action: string, userName: string) => {
    toast({
      title: `Azione Eseguita: ${action}`,
      description: `${action} per l'utente ${userName} è stato richiesto. (Funzionalità demo)`,
    });
  };
  
  if (loading) { 
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Caricamento utenti...</span>
      </div>
    );
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
            {users.map((user) => {
              const avatarSrc = parseImg(user.avatar) || `https://placehold.co/40x40.png?text=${(user.first_name || 'U')[0]}${(user.last_name || 'N')[0]}`;
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <Image
                      src={avatarSrc}
                      alt={user.displayName || 'User avatar'}
                      width={40}
                      height={40}
                      className="rounded-full"
                      data-ai-hint="avatar profile"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.first_name || '-'}</TableCell>
                  <TableCell>{user.last_name || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString('it-IT') : '-'}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleAction('Cambia Password', user.displayName || user.email || 'Utente Selezionato')}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Cambia Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(user.disabled ? 'Abilita Utente' : 'Disabilita Utente', user.displayName || user.email || 'Utente Selezionato')}>
                          <UserX className="mr-2 h-4 w-4" />
                          {user.disabled ? 'Abilita Utente' : 'Disabilita Utente'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleAction('Elimina Utente', user.displayName || user.email || 'Utente Selezionato')}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Elimina Utente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
         {users.length === 0 && !loading && (
          <p className="text-center py-4 text-muted-foreground">Nessun utente trovato.</p>
        )}
      </CardContent>
    </Card>
  );
}
