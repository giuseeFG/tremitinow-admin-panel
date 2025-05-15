
"use client";

import type { User } from '@/types';
import Image from 'next/image';
import { MoreHorizontal, KeyRound, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/graphql/client';
import { GET_USERS_BY_ROLE_QUERY, REMOVE_USER_MUTATION, UPDATE_USER_STATUS_MUTATION } from '@/lib/graphql/queries';
import { parseImg } from '@/lib/utils';

// Placeholder functions for Firebase operations via backend API
async function deleteFirebaseUser(uid: string): Promise<any> {
  console.warn(`[DEMO] deleteFirebaseUser called for UID: ${uid}. Backend implementation via apiFirebase needed.`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  return { success: true, message: "Firebase user deletion simulated." };
}

async function disableFirebaseUser(uid: string): Promise<any> {
  console.warn(`[DEMO] disableFirebaseUser called for UID: ${uid}. Backend implementation via apiFirebase needed.`);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, message: "Firebase user disable simulated." };
}

async function enableFirebaseUser(uid: string): Promise<any> {
  console.warn(`[DEMO] enableFirebaseUser called for UID: ${uid}. Backend implementation via apiFirebase needed.`);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, message: "Firebase user enable simulated." };
}

async function changeFirebaseUserPassword(uid: string, newPassword?: string): Promise<any> {
  console.warn(`[DEMO] changeFirebaseUserPassword called for UID: ${uid} (password not shown for security). Backend implementation via apiFirebase needed.`);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, message: "Firebase user password change simulated." };
}


export default function UtentiPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);


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
          toast({ title: "Errore Caricamento Utenti", description: `Impossibile caricare gli utenti: ${response.errors[0].message}`, variant: "destructive" });
        } else {
          toast({ title: "Errore Dati Utenti", description: "Nessun dato utente ricevuto.", variant: "destructive" });
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

  const handlePasswordChangeAction = async (user: User) => {
    const newPassword = window.prompt(`[DEMO] Inserisci la nuova password per ${user.displayName || user.email}:`);
    if (newPassword && user.firebaseId) {
      try {
        await changeFirebaseUserPassword(user.firebaseId, newPassword);
        toast({
          title: "Cambia Password (Simulato)",
          description: `La password per ${user.displayName || user.email} è stata (simulata) cambiata.`,
        });
      } catch (error) {
        console.error("Simulated password change error:", error);
        toast({
          title: "Errore Simulazione Password",
          description: `Impossibile simulare il cambio password.`,
          variant: "destructive",
        });
      }
    } else if (newPassword === null) {
      // User cancelled prompt
    } else {
      toast({ title: "Azione Annullata", description: "Nessuna password fornita o utente non valido.", variant: "default" });
    }
  };

  const handleToggleUserStatusAction = async (userId: number) => {
    const userToToggle = users.find(u => u.id === userId);
    if (!userToToggle || !userToToggle.firebaseId) {
      toast({ title: "Errore", description: "Utente non trovato o ID Firebase mancante.", variant: "destructive" });
      return;
    }

    const currentStatusIsDisabled = userToToggle.status === 'disabled';
    const newStatus = currentStatusIsDisabled ? 'active' : 'disabled';
    const optimisticUserDisplay = userToToggle.displayName || userToToggle.email;

    try {
      // 1. Update status in Hasura
      const dbResponse = await apiClient(UPDATE_USER_STATUS_MUTATION, { id: userToToggle.id, status: newStatus });
      if (dbResponse.errors || !dbResponse.data?.update_users_by_pk) {
        throw new Error(dbResponse.errors ? dbResponse.errors[0].message : "Failed to update user status in database.");
      }

      // 2. Conceptually update Firebase Auth status (requires backend)
      if (newStatus === 'disabled') {
        await disableFirebaseUser(userToToggle.firebaseId);
      } else {
        await enableFirebaseUser(userToToggle.firebaseId);
      }

      // 3. Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, status: newStatus, disabled: newStatus === 'disabled' } : u
        )
      );
      toast({
        title: `Utente ${newStatus === 'active' ? 'Abilitato' : 'Disabilitato'}`,
        description: `Lo stato di ${optimisticUserDisplay} è stato aggiornato.`,
      });
    } catch (error) {
      console.error("Error toggling user status:", error);
      const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto durante il cambio stato.";
      toast({
        title: "Errore Cambio Stato",
        description: `Impossibile cambiare lo stato di ${optimisticUserDisplay}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };


  const openDeleteConfirmation = (user: User) => {
    setUserToDelete(user);
    setIsAlertDialogOpen(true);
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
        await deleteFirebaseUser(userToDelete.firebaseId);
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
      setUserToDelete(null);
      setIsAlertDialogOpen(false);
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
                const isDisabled = user.status === 'disabled'; // Derive from status string
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
                      <Badge variant={isDisabled ? 'destructive' : 'default'}>
                        {isDisabled ? 'Disabilitato' : 'Attivo'}
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
                          <DropdownMenuItem onClick={() => handlePasswordChangeAction(user)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Cambia Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleUserStatusAction(user.id)}>
                            {isDisabled ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <XCircle className="mr-2 h-4 w-4 text-red-500" />}
                            {isDisabled ? 'Abilita Utente' : 'Disabilita Utente'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onSelect={() => openDeleteConfirmation(user)}
                            >
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

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare l'utente {userToDelete?.displayName || userToDelete?.email}? Questa azione non può essere annullata.
              L'utente verrà rimosso dal database e il suo account Firebase verrà (concettualmente) eliminato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setUserToDelete(null); setIsAlertDialogOpen(false);}} disabled={isDeleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    
