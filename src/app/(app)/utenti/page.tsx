
"use client";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/graphql/client';
import { GET_USERS_BY_ROLE_QUERY, REMOVE_USER_MUTATION } from '@/lib/graphql/queries';
import { parseImg } from '@/lib/utils';

// Placeholder for the backend function to delete Firebase user
// You'll need to implement apiFirebase and the backend endpoint
async function deleteFirebaseUser(uid: string): Promise<any> {
  console.warn("deleteFirebaseUser function is a placeholder. Backend implementation required via apiFirebase.");
  // Example structure if you had an apiFirebase client:
  // try {
  //   const response: any = await apiFirebase.post('/removeFirebaseUser', {uid});
  //   if (!response) {
  //     throw new Error("No response from Firebase user deletion endpoint");
  //   }
  //   return response.result;
  // } catch (error) {
  //   console.error("Error calling Firebase user deletion endpoint:", error);
  //   throw error; // Re-throw to be caught by caller
  // }
  return Promise.resolve({ success: true, message: "Firebase user deletion simulated." });
}


export default function UtentiPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await apiClient<{ users: any[] }>(GET_USERS_BY_ROLE_QUERY, { role: 'user' });
        if (response.data && response.data.users) {
          const fetchedUsers: User[] = response.data.users.map(u => ({
            ...u, 
            id: parseInt(u.id, 10), 
            disabled: u.status === 'disabled',
            displayName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          }));
          setUsers(fetchedUsers);
        } else if (response.errors) {
          console.error("GraphQL errors:", response.errors);
          toast({ title: "Errore Caricamento", description: `Impossibile caricare gli utenti: ${response.errors[0].message}`, variant: "destructive" });
        } else {
          toast({ title: "Errore Dati", description: "Nessun dato utente ricevuto.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({ title: "Errore di Rete", description: "Impossibile connettersi al server per caricare gli utenti.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);

  const handlePasswordChangeAction = (userName: string) => {
    toast({
      title: "Cambia Password (Demo)",
      description: `Azione 'Cambia Password' per l'utente ${userName} è stata richiesta. (Funzionalità demo)`,
    });
  };

  const handleToggleUserStatusAction = (userName: string, isDisabled: boolean | undefined) => {
     const actionText = isDisabled ? 'Abilita Utente' : 'Disabilita Utente';
    toast({
      title: `${actionText} (Demo)`,
      description: `Azione '${actionText}' per l'utente ${userName} è stata richiesta. (Funzionalità demo)`,
    });
  };

  const openDeleteConfirmation = (user: User) => {
    setUserToDelete(user);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    const userNameToDelete = userToDelete.displayName || userToDelete.email || "Utente Selezionato";

    try {
      // 1. Delete from Hasura
      const dbResponse = await apiClient(REMOVE_USER_MUTATION, { id: userToDelete.id });
      if (dbResponse.errors || !dbResponse.data?.delete_users_by_pk) {
        throw new Error(dbResponse.errors ? dbResponse.errors[0].message : "Failed to delete user from database.");
      }

      // 2. Conceptually delete from Firebase Auth (requires backend)
      if (userToDelete.firebaseId) {
        try {
          await deleteFirebaseUser(userToDelete.firebaseId);
          // If successful, Firebase onAuthStateChanged should eventually update auth state if current user was deleted.
        } catch (firebaseError) {
          console.warn("Failed to delete Firebase user (backend call needed):", firebaseError);
          // Decide if this is a critical error. For now, we'll proceed with UI update.
          // toast({ title: "Avviso", description: "Utente eliminato dal DB, ma si è verificato un problema con la rimozione da Firebase Auth.", variant: "default" });
        }
      }
      
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
      toast({ 
        title: "Utente Eliminato", 
        description: `L'utente ${userNameToDelete} è stato eliminato con successo.`,
        variant: "destructive" 
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto durante l'eliminazione.";
      toast({ 
        title: "Errore Eliminazione", 
        description: `Impossibile eliminare l'utente ${userNameToDelete}: ${errorMessage}`, 
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null); // Close modal by resetting userToDelete
    }
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
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">Gestione Utenti</CardTitle>
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
                          <DropdownMenuItem onClick={() => handlePasswordChangeAction(user.displayName || user.email || 'Utente Selezionato')}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Cambia Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleUserStatusAction(user.displayName || user.email || 'Utente Selezionato', user.disabled)}>
                            <UserX className="mr-2 h-4 w-4" />
                            {user.disabled ? 'Abilita Utente' : 'Disabilita Utente'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onSelect={() => openDeleteConfirmation(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Elimina Utente
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
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

      {userToDelete && (
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare l'utente {userToDelete.displayName || userToDelete.email}? Questa azione non può essere annullata.
                L'utente verrà rimosso dal database e il suo account Firebase verrà (concettualmente) eliminato.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isDeleting}>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
