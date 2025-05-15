
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

const FIREBASE_FUNCTIONS_BASE_URL = process.env.NEXT_PUBLIC_FIREBASE_BASE_URL || "https://europe-west3-tremti-n.cloudfunctions.net";

async function deleteFirebaseUser(uid: string): Promise<any> {
  console.log(`[API_CALL] Attempting to delete Firebase user UID: ${uid} via ${FIREBASE_FUNCTIONS_BASE_URL}/removeFirebaseUser`);
  try {
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/removeFirebaseUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API_CALL_ERROR] Failed to delete Firebase user ${uid}. Status: ${response.status}, Body: ${errorText}`);
      throw new Error(`Failed to delete Firebase user: ${errorText || response.statusText}`);
    }
    const data = await response.json();
    console.log(`[API_CALL_SUCCESS] deleteFirebaseUser for UID ${uid}:`, data.result);
    return data.result;
  } catch (error) {
    console.error(`[API_CALL_EXCEPTION] Error deleting Firebase user ${uid}:`, error);
    return null;
  }
}

async function disableFirebaseUser(uid: string): Promise<any> {
  console.log(`[API_CALL] Attempting to disable Firebase user UID: ${uid} via ${FIREBASE_FUNCTIONS_BASE_URL}/disableFirebaseUser`);
  try {
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/disableFirebaseUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API_CALL_ERROR] Failed to disable Firebase user ${uid}. Status: ${response.status}, Body: ${errorText}`);
      throw new Error(`Failed to disable Firebase user: ${errorText || response.statusText}`);
    }
    const data = await response.json();
    console.log(`[API_CALL_SUCCESS] disableFirebaseUser for UID ${uid}:`, data.result);
    return data.result;
  } catch (error) {
    console.error(`[API_CALL_EXCEPTION] Error disabling Firebase user ${uid}:`, error);
    return null;
  }
}

async function enableFirebaseUser(uid: string): Promise<any> {
  console.log(`[API_CALL] Attempting to enable Firebase user UID: ${uid} via ${FIREBASE_FUNCTIONS_BASE_URL}/enableFirebaseUser`);
  try {
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/enableFirebaseUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API_CALL_ERROR] Failed to enable Firebase user ${uid}. Status: ${response.status}, Body: ${errorText}`);
      throw new Error(`Failed to enable Firebase user: ${errorText || response.statusText}`);
    }
    const data = await response.json();
    console.log(`[API_CALL_SUCCESS] enableFirebaseUser for UID ${uid}:`, data.result);
    return data.result;
  } catch (error) {
    console.error(`[API_CALL_EXCEPTION] Error enabling Firebase user ${uid}:`, error);
    return null;
  }
}

async function changeFirebaseUserPassword(uid: string, newPassword?: string): Promise<any> {
  console.log(`[API_CALL] Attempting to change password for UID: ${uid} via ${FIREBASE_FUNCTIONS_BASE_URL}/setPassword`);
   if (!newPassword) {
    console.warn("[API_CALL] No new password provided for changeFirebaseUserPassword.");
    return null;
  }
  try {
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/setPassword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, password: newPassword }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API_CALL_ERROR] Failed to change password for UID ${uid}. Status: ${response.status}, Body: ${errorText}`);
      throw new Error(`Failed to change password: ${errorText || response.statusText}`);
    }
    const data = await response.json();
    console.log(`[API_CALL_SUCCESS] changeFirebaseUserPassword for UID ${uid}:`, data.result);
    return data.result;
  } catch (error) {
    console.error(`[API_CALL_EXCEPTION] Error changing password for UID ${uid}:`, error);
    return null;
  }
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
            disabled: u.status === 'DISABLED', 
            displayName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          }));
          setUsers(fetchedUsers);
        } else if (response.errors) {
          console.error("GraphQL errors fetching users:", response.errors);
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
    const newPassword = window.prompt(`Inserisci la nuova password per ${user.displayName || user.email}:`);
    if (newPassword && user.firebaseId) {
      try {
        const result = await changeFirebaseUserPassword(user.firebaseId, newPassword);
        if (result) { // Assuming result indicates success
            toast({
            title: "Cambia Password",
            description: `La password per ${user.displayName || user.email} è stata cambiata.`,
            });
        } else {
            throw new Error("L'operazione di cambio password è fallita o non ha restituito un successo.");
        }
      } catch (error: any) {
        console.error("Password change error:", error);
        toast({
          title: "Errore Cambio Password",
          description: error.message || `Impossibile cambiare la password.`,
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

    const currentStatusIsDisabled = userToToggle.status === 'DISABLED';
    const newStatus = currentStatusIsDisabled ? 'ACTIVE' : 'DISABLED';
    const optimisticUserDisplay = userToToggle.displayName || userToToggle.email;

    try {
      console.log(`Attempting to update status for user ${userId} to ${newStatus} in Hasura.`);
      const dbResponse = await apiClient(UPDATE_USER_STATUS_MUTATION, { id: userToToggle.id, status: newStatus });
      
      if (dbResponse.errors || !dbResponse.data?.update_users_by_pk) {
        console.error("Hasura status update failed:", dbResponse.errors || "No data returned from update_users_by_pk mutation.");
        throw new Error(dbResponse.errors ? dbResponse.errors[0].message : "Failed to update user status in database.");
      }
      console.log(`Hasura status update for user ${userId} to ${newStatus} successful.`);

      console.log(`Attempting to update Firebase status for user ${userToToggle.firebaseId} to ${newStatus}.`);
      let firebaseUpdateResult;
      if (newStatus === 'DISABLED') {
        console.log(`Calling disableFirebaseUser for ${userToToggle.firebaseId}.`);
        firebaseUpdateResult = await disableFirebaseUser(userToToggle.firebaseId);
      } else {
        console.log(`Calling enableFirebaseUser for ${userToToggle.firebaseId}.`);
        firebaseUpdateResult = await enableFirebaseUser(userToToggle.firebaseId);
      }
      
      if (!firebaseUpdateResult) { // Assuming result indicates success
         throw new Error("L'operazione di aggiornamento Firebase è fallita.");
      }
      console.log(`Firebase status update for user ${userToToggle.firebaseId} complete.`);

      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, status: newStatus, disabled: newStatus === 'DISABLED' } : u
        )
      );
      toast({
        title: `Utente ${newStatus === 'ACTIVE' ? 'Abilitato' : 'Disabilitato'}`,
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
      // Revert optimistic UI update or refetch if necessary
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
      // 1. Delete from Hasura DB
      const dbResponse = await apiClient(REMOVE_USER_MUTATION, { id: userToDelete.id });
      if (dbResponse.errors || !dbResponse.data?.delete_users_by_pk) {
        throw new Error(dbResponse.errors ? dbResponse.errors[0].message : "Failed to delete user from database.");
      }

      // 2. Delete from Firebase Auth via backend function
      if (userToDelete.firebaseId) {
        const firebaseDeleteResult = await deleteFirebaseUser(userToDelete.firebaseId);
         if (!firebaseDeleteResult) { // Assuming result indicates success
          console.warn(`Firebase user ${userToDelete.firebaseId} might not have been deleted if backend call failed or returned falsy.`);
          // Decide if this should be a hard error or a soft warning
        }
      }

      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
      toast({
        title: "Utente Eliminato",
        description: `L'utente ${userNameToDelete} è stato eliminato.`,
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
                const isDisabled = user.status === 'DISABLED';
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
              L'utente verrà rimosso dal database e il suo account Firebase verrà eliminato.
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
