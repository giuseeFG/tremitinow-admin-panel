"use client";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";

// Mock data (replace with Firestore query)
const mockOperators: User[] = [
  { id: 'op1', firstName: 'Mario', lastName: 'Rossi', email: 'op@example.com', role: 'operator', createdAt: new Date(2022, 5, 1).toISOString(), avatarUrl: 'https://placehold.co/40x40.png?text=MR', disabled: false },
  { id: 'op2', firstName: 'Laura', lastName: 'Bianchi', email: 'lb@example.com', role: 'operator', createdAt: new Date(2022, 6, 15).toISOString(), avatarUrl: 'https://placehold.co/40x40.png?text=LB', disabled: false },
];

export default function OperatoriPage() {
  const { toast } = useToast();

  const handleAction = (action: string, userName: string) => {
    toast({
      title: `Azione Eseguita: ${action}`,
      description: `${action} per l'operatore ${userName} è stato richiesto. (Funzionalità demo)`,
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">Gestione Operatori</CardTitle>
        <CardDescription>Visualizza e gestisci gli utenti con ruolo "operator".</CardDescription>
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
            {mockOperators.map((operator) => (
              <TableRow key={operator.id}>
                <TableCell>
                  <Image
                    src={operator.avatarUrl || `https://placehold.co/40x40.png?text=${operator.firstName[0]}${operator.lastName[0]}`}
                    alt={`${operator.firstName} ${operator.lastName}`}
                    width={40}
                    height={40}
                    className="rounded-full"
                    data-ai-hint="avatar profile"
                  />
                </TableCell>
                <TableCell className="font-medium">{operator.firstName}</TableCell>
                <TableCell>{operator.lastName}</TableCell>
                <TableCell className="text-muted-foreground">{operator.email}</TableCell>
                <TableCell>{new Date(operator.createdAt).toLocaleDateString('it-IT')}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleAction('Cambia Password', `${operator.firstName} ${operator.lastName}`)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Cambia Password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(operator.disabled ? 'Abilita Operatore' : 'Disabilita Operatore', `${operator.firstName} ${operator.lastName}`)}>
                        <UserX className="mr-2 h-4 w-4" />
                        {operator.disabled ? 'Abilita Operatore' : 'Disabilita Operatore'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleAction('Elimina Operatore', `${operator.firstName} ${operator.lastName}`)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Elimina Operatore
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
