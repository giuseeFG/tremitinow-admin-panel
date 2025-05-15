
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/graphql/client';
import { GET_USERS_BY_ROLE_QUERY } from '@/lib/graphql/queries';
import { parseImg } from '@/lib/utils';

export default function OperatoriPage() {
  const { toast } = useToast();
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
            // avatar is handled by parseImg later
          }));
          setOperators(fetchedOperators);
        } else if (response.errors) {
          console.error("GraphQL errors:", response.errors);
          toast({ title: "Errore", description: `Impossibile caricare gli operatori: ${response.errors[0].message}`, variant: "destructive" });
        } else {
           toast({ title: "Errore", description: "Nessun dato operatore ricevuto.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Failed to fetch operators:", error);
        toast({ title: "Errore", description: "Impossibile connettersi al server per caricare gli operatori.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchOperators();
  }, [toast]);

  const handleAction = (action: string, userName: string) => {
    toast({
      title: `Azione Eseguita: ${action}`,
      description: `${action} per l'operatore ${userName} è stato richiesto. (Funzionalità demo)`,
    });
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
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-bold text-foreground">Gestione Operatori</CardTitle>
          {/* <CardDescription>Visualizza e gestisci gli utenti con ruolo "operator".</CardDescription> */}
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
                        <DropdownMenuItem onClick={() => handleAction('Cambia Password', operator.displayName || operator.email || 'Operatore Selezionato')}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Cambia Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(operator.disabled ? 'Abilita Operatore' : 'Disabilita Operatore', operator.displayName || operator.email || 'Operatore Selezionato')}>
                          <UserX className="mr-2 h-4 w-4" />
                          {operator.disabled ? 'Abilita Operatore' : 'Disabilita Operatore'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleAction('Elimina Operatore', operator.displayName || operator.email || 'Operatore Selezionato')}>
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
  );
}
