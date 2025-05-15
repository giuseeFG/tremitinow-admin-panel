
"use client";

import type { User } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, UserX, KeyRound, Trash2, PlusCircle, Loader2 } from 'lucide-react';
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


export default function OperatoriPage() {
  const { toast } = useToast();
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<User | null>(null);

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
          toast({ title: "Errore Caricamento", description: `Impossibile caricare gli operatori: ${response.errors[0].message}`, variant: "destructive" });
        } else {
           toast({ title: "Errore Dati", description: "Nessun dato operatore ricevuto.", variant: "destructive" });
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

  const handlePasswordChangeAction = (operatorName: string) => {
    toast({
      title: "Cambia Password (Demo)",
      description: `Azione 'Cambia Password' per l'operatore ${operatorName} è stata richiesta. (Funzionalità demo)`,
    });
  };

  const handleToggleOperatorStatusAction = (operatorName: string, isDisabled: boolean | undefined) => {
    const actionText = isDisabled ? 'Abilita Operatore' : 'Disabilita Operatore';
    toast({
      title: `${actionText} (Demo)`,
      description: `Azione '${actionText}' per l'operatore ${operatorName} è stata richiesta. (Funzionalità demo)`,
    });
  };

  const openDeleteConfirmation = (operator: User) => {
    setOperatorToDelete(operator);
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
        try {
          await deleteFirebaseUser(operatorToDelete.firebaseId);
        } catch (firebaseError) {
          console.warn("Failed to delete Firebase user (backend call needed):", firebaseError);
          // toast({ title: "Avviso", description: "Operatore eliminato dal DB, ma si è verificato un problema con la rimozione da Firebase Auth.", variant: "default" });
        }
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
                      <Badge variant={operator.disabled ? 'destructive' : 'default'}>
                        {operator.disabled ? 'Disabilitato' : 'Attivo'}
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
                          <DropdownMenuItem onClick={() => handlePasswordChangeAction(operator.displayName || operator.email || 'Operatore Selezionato')}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Cambia Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleOperatorStatusAction(operator.displayName || operator.email || 'Operatore Selezionato', operator.disabled)}>
                            <UserX className="mr-2 h-4 w-4" />
                            {operator.disabled ? 'Abilita Operatore' : 'Disabilita Operatore'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onSelect={() => openDeleteConfirmation(operator)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Elimina Operatore
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
          {operators.length === 0 && !loading && (
            <p className="text-center py-4 text-muted-foreground">Nessun operatore trovato.</p>
          )}
        </CardContent>
      </Card>

      {operatorToDelete && (
        <AlertDialog open={!!operatorToDelete} onOpenChange={(open) => !open && setOperatorToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare l'operatore {operatorToDelete.displayName || operatorToDelete.email}? Questa azione non può essere annullata.
                L'operatore verrà rimosso dal database e il suo account Firebase verrà (concettualmente) eliminato.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOperatorToDelete(null)} disabled={isDeleting}>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteOperator} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
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
