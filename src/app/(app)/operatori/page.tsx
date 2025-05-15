
"use client";

import type { User } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, KeyRound, Trash2, PlusCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NewOperatorForm } from '@/components/operatori/NewOperatorForm';

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


export default function OperatoriPage() {
  const { toast } = useToast();
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<User | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isCreateOperatorDialogOpen, setIsCreateOperatorDialogOpen] = useState(false);

  const fetchOperators = React.useCallback(async () => {
    setLoading(true);
    try {
      console.log("Fetching operators...");
      const response = await apiClient<{ users: any[] }>(GET_USERS_BY_ROLE_QUERY, { role: 'operator' });
      if (response.data && response.data.users) {
        const fetchedOperators: User[] = response.data.users.map(u => ({
          ...u,
          id: parseInt(u.id, 10),
          status: u.status || 'ACTIVE', // Default to ACTIVE if status is null/undefined
          disabled: u.status === 'DISABLED',
          displayName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        }));
        console.log("Operators fetched:", fetchedOperators);
        setOperators(fetchedOperators);
      } else if (response.errors) {
        console.error("GraphQL errors fetching operators:", response.errors);
        toast({ title: "Errore Caricamento Operatori", description: `Impossibile caricare gli operatori: ${response.errors[0].message}`, variant: "destructive" });
      } else {
         console.warn("No data or errors in operator fetch response.");
         toast({ title: "Errore Dati Operatori", description: "Nessun dato operatore ricevuto.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to fetch operators:", error);
      toast({ title: "Errore di Rete", description: "Impossibile connettersi al server per caricare gli operatori.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);
  
  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  const handlePasswordChangeAction = async (operator: User) => {
    const newPassword = window.prompt(`Inserisci la nuova password per ${operator.displayName || operator.email}:`);
    if (newPassword && operator.firebaseId) {
      try {
        const result = await changeFirebaseUserPassword(operator.firebaseId, newPassword);
        if (result) { 
          toast({
            title: "Cambia Password",
            description: `La password per ${operator.displayName || operator.email} è stata cambiata.`,
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
      toast({ title: "Azione Annullata", description: "Nessuna password fornita o operatore non valido.", variant: "default" });
    }
  };

  const handleToggleOperatorStatusAction = async (operatorId: number) => {
    const operatorToToggle = operators.find(op => op.id === operatorId);
    if (!operatorToToggle || !operatorToToggle.firebaseId) {
      toast({ title: "Errore", description: "Operatore non trovato o ID Firebase mancante.", variant: "destructive" });
      return;
    }
    
    const currentStatusIsDisabled = operatorToToggle.status === 'DISABLED';
    const newStatus = currentStatusIsDisabled ? 'ACTIVE' : 'DISABLED';
    const optimisticOperatorDisplay = operatorToToggle.displayName || operatorToToggle.email;

    console.log(`Attempting to toggle operator ${operatorId} (${optimisticOperatorDisplay}) from ${operatorToToggle.status} to ${newStatus}`);

    try {
      console.log(`Updating status for operator ${operatorId} to ${newStatus} in Hasura.`);
      const dbResponse = await apiClient(UPDATE_USER_STATUS_MUTATION, { id: operatorToToggle.id, status: newStatus });
      if (dbResponse.errors || !dbResponse.data?.update_users_by_pk) {
        console.error("Hasura status update failed:", dbResponse.errors || "No data returned from update_users_by_pk mutation.");
        throw new Error(dbResponse.errors ? dbResponse.errors[0].message : "Failed to update operator status in database.");
      }
      console.log(`Hasura status update for operator ${operatorId} to ${newStatus} successful.`);
      
      let firebaseUpdateResult;
      if (newStatus === 'DISABLED') {
        console.log(`Calling disableFirebaseUser for Firebase ID: ${operatorToToggle.firebaseId}.`);
        firebaseUpdateResult = await disableFirebaseUser(operatorToToggle.firebaseId);
      } else {
        console.log(`Calling enableFirebaseUser for Firebase ID: ${operatorToToggle.firebaseId}.`);
        firebaseUpdateResult = await enableFirebaseUser(operatorToToggle.firebaseId);
      }

      if (!firebaseUpdateResult) { 
         console.warn(`Firebase status update for Firebase ID ${operatorToToggle.firebaseId} might have failed or returned a falsy value.`);
         // Decide if this should be a hard error. For now, we proceed but log a warning.
         // throw new Error("L'operazione di aggiornamento Firebase è fallita o non ha restituito un successo.");
      } else {
        console.log(`Firebase status update for Firebase ID ${operatorToToggle.firebaseId} successful.`);
      }
      
      setOperators(prevOperators =>
        prevOperators.map(op =>
          op.id === operatorId ? { ...op, status: newStatus, disabled: newStatus === 'DISABLED' } : op
        )
      );
      toast({
        title: `Operatore ${newStatus === 'ACTIVE' ? 'Abilitato' : 'Disabilitato'}`,
        description: `Lo stato di ${optimisticOperatorDisplay} è stato aggiornato.`,
      });
    } catch (error) {
      console.error("Error toggling operator status:", error);
      const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto durante il cambio stato.";
      toast({
        title: "Errore Cambio Stato",
        description: `Impossibile cambiare lo stato di ${optimisticOperatorDisplay}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };


  const openDeleteConfirmation = (operator: User) => {
    setOperatorToDelete(operator);
    setIsAlertDialogOpen(true);
  };

  const handleDeleteOperator = async () => {
    if (!operatorToDelete) return;

    setIsDeleting(true);
    const operatorNameToDelete = operatorToDelete.displayName || operatorToDelete.email || "Operatore Selezionato";

    try {
      console.log(`Attempting to delete operator ${operatorToDelete.id} from Hasura.`);
      const dbResponse = await apiClient(REMOVE_USER_MUTATION, { id: operatorToDelete.id });
      if (dbResponse.errors || !dbResponse.data?.delete_users_by_pk) {
        console.error("Hasura delete failed:", dbResponse.errors || "No data returned from delete_users_by_pk mutation.");
        throw new Error(dbResponse.errors ? dbResponse.errors[0].message : "Failed to delete operator from database.");
      }
      console.log(`Operator ${operatorToDelete.id} deleted from Hasura successfully.`);

      if (operatorToDelete.firebaseId) {
        console.log(`Attempting to delete Firebase user ${operatorToDelete.firebaseId}.`);
        const firebaseDeleteResult = await deleteFirebaseUser(operatorToDelete.firebaseId);
        if (!firebaseDeleteResult) { 
          console.warn(`Firebase user ${operatorToDelete.firebaseId} might not have been deleted if backend call failed or returned falsy.`);
        } else {
          console.log(`Firebase user ${operatorToDelete.firebaseId} deleted successfully.`);
        }
      } else {
        console.warn(`Operator ${operatorToDelete.id} does not have a Firebase ID. Skipping Firebase deletion.`);
      }

      setOperators(prevOperators => prevOperators.filter(op => op.id !== operatorToDelete.id));
      toast({
        title: "Operatore Eliminato",
        description: `L'operatore ${operatorNameToDelete} è stato eliminato.`,
      });
    } catch (error) {
      console.error("Error deleting operator:", error);
      const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto durante l'eliminazione.";
      toast({
        title: "Errore Eliminazione",
        description: `Impossibile eliminare l'operatore ${operatorNameToDelete}: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setOperatorToDelete(null);
      setIsAlertDialogOpen(false);
    }
  };

  const handleOperatorCreated = () => {
    setIsCreateOperatorDialogOpen(false);
    fetchOperators(); 
  };


  if (loading && !isCreateOperatorDialogOpen) { 
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Caricamento operatori...</span>
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">Gestione Operatori</CardTitle>
          </div>
          <Button onClick={() => setIsCreateOperatorDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Aggiungi Operatore
          </Button>
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
              {operators.map((operator) => {
                const avatarSrc = parseImg(operator.avatar) || `https://placehold.co/40x40.png?text=${(operator.first_name || 'O')[0]}${(operator.last_name || 'P')[0]}`;
                const isDisabled = operator.status === 'DISABLED'; 
                return (
                  <TableRow key={operator.id}>
                    <TableCell>
                      <Image
                        src={avatarSrc}
                        alt={operator.displayName || 'Operator avatar'}
                        width={40}
                        height={40}
                        className="rounded-full"
                        data-ai-hint="avatar profile"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{operator.first_name || '-'}</TableCell>
                    <TableCell>{operator.last_name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{operator.email}</TableCell>
                    <TableCell>{operator.created_at ? new Date(operator.created_at).toLocaleDateString('it-IT') : '-'}</TableCell>
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
                          <DropdownMenuItem onClick={() => handlePasswordChangeAction(operator)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Cambia Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleOperatorStatusAction(operator.id)}>
                             {isDisabled ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <XCircle className="mr-2 h-4 w-4 text-red-500" />}
                            {isDisabled ? 'Abilita Operatore' : 'Disabilita Operatore'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onSelect={() => openDeleteConfirmation(operator)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Elimina Operatore
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {operators.length === 0 && !loading && (
            <p className="text-center py-4 text-muted-foreground">Nessun operatore trovato.</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare l'operatore {operatorToDelete?.displayName || operatorToDelete?.email}? Questa azione non può essere annullata.
                L'operatore verrà rimosso dal database e il suo account Firebase verrà eliminato.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setOperatorToDelete(null); setIsAlertDialogOpen(false);}} disabled={isDeleting}>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteOperator} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateOperatorDialogOpen} onOpenChange={setIsCreateOperatorDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Operatore</DialogTitle>
            <DialogDescription>
              Compila i campi sottostanti per creare un nuovo operatore.
              Verrà inviata un'email per impostare la password.
            </DialogDescription>
          </DialogHeader>
          <NewOperatorForm onOperatorCreated={handleOperatorCreated} />
        </DialogContent>
      </Dialog>
    </>
  );
}

