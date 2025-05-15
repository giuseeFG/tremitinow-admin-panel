

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

// Placeholder functions for Firebase operations via backend API
async function deleteFirebaseUser(uid: string): Promise<any> {
  console.warn(`[DEMO] deleteFirebaseUser called for UID: ${uid}. Backend implementation via apiFirebase needed.`);
  await new Promise(resolve => setTimeout(resolve, 500));
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


export default function OperatoriPage() {
  const { toast } = useToast();
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<User | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  useEffect(() => {
    const fetchOperators = async () => {
      setLoading(true);
      try {
        const response = await apiClient<{ users: any[] }>(GET_USERS_BY_ROLE_QUERY, { role: 'operator' });
        if (response.data && response.data.users) {
          const fetchedOperators: User[] = response.data.users.map(u => ({
            ...u,
            id: parseInt(u.id, 10),
            disabled: u.status === 'disabled',
            displayName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          }));
          setOperators(fetchedOperators);
        } else if (response.errors) {
          console.error("GraphQL errors:", response.errors);
          toast({ title: "Errore Caricamento Operatori", description: `Impossibile caricare gli operatori: ${response.errors[0].message}`, variant: "destructive" });
        } else {
           toast({ title: "Errore Dati Operatori", description: "Nessun dato operatore ricevuto.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Failed to fetch operators:", error);
        toast({ title: "Errore di Rete", description: "Impossibile connettersi al server per caricare gli operatori.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchOperators();
  }, [toast]);

  const handlePasswordChangeAction = async (operator: User) => {
    const newPassword = window.prompt(`[DEMO] Inserisci la nuova password per ${operator.displayName || operator.email}:`);
    if (newPassword && operator.firebaseId) {
      try {
        await changeFirebaseUserPassword(operator.firebaseId, newPassword);
        toast({
          title: "Cambia Password (Simulato)",
          description: `La password per ${operator.displayName || operator.email} è stata (simulata) cambiata.`,
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
      toast({ title: "Azione Annullata", description: "Nessuna password fornita o operatore non valido.", variant: "default" });
    }
  };

  const handleToggleOperatorStatusAction = async (operatorId: number) => {
    const operatorToToggle = operators.find(op => op.id === operatorId);
    if (!operatorToToggle || !operatorToToggle.firebaseId) {
      toast({ title: "Errore", description: "Operatore non trovato o ID Firebase mancante.", variant: "destructive" });
      return;
    }
    
    const currentStatusIsDisabled = operatorToToggle.status === 'disabled';
    const newStatus = currentStatusIsDisabled ? 'active' : 'disabled';
    const optimisticOperatorDisplay = operatorToToggle.displayName || operatorToToggle.email;

    try {
      // 1. Update status in Hasura
      const dbResponse = await apiClient(UPDATE_USER_STATUS_MUTATION, { id: operatorToToggle.id, status: newStatus });
      if (dbResponse.errors || !dbResponse.data?.update_users_by_pk) {
        throw new Error(dbResponse.errors ? dbResponse.errors[0].message : "Failed to update operator status in database.");
      }

      // 2. Conceptually update Firebase Auth status (requires backend)
      if (newStatus === 'disabled') {
        await disableFirebaseUser(operatorToToggle.firebaseId);
      } else {
        await enableFirebaseUser(operatorToToggle.firebaseId);
      }
      
      // 3. Update local state
      setOperators(prevOperators =>
        prevOperators.map(op =>
          op.id === operatorId ? { ...op, status: newStatus, disabled: newStatus === 'disabled' } : op
        )
      );
      toast({
        title: `Operatore ${newStatus === 'active' ? 'Abilitato' : 'Disabilitato'}`,
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
      // 1. Delete from Hasura
      const dbResponse = await apiClient(REMOVE_USER_MUTATION, { id: operatorToDelete.id });
      if (dbResponse.errors || !dbResponse.data?.delete_users_by_pk) {
        throw new Error(dbResponse.errors ? dbResponse.errors[0].message : "Failed to delete operator from database.");
      }

      // 2. Conceptually delete from Firebase Auth (requires backend)
      if (operatorToDelete.firebaseId) {
        await deleteFirebaseUser(operatorToDelete.firebaseId);
      }

      setOperators(prevOperators => prevOperators.filter(op => op.id !== operatorToDelete.id));
      toast({
        title: "Operatore Eliminato",
        description: `L'operatore ${operatorNameToDelete} è stato eliminato con successo.`,
        variant: "destructive"
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

  if (loading) {
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
          <Button asChild>
            <Link href="/operatori/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Aggiungi Operatore
            </Link>
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
                const isDisabled = operator.status === 'disabled'; // Derive from status string
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
                L'operatore verrà rimosso dal database e il suo account Firebase verrà (concettualmente) eliminato.
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
    </>
  );
}

    
