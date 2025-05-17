
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiClient } from '@/lib/graphql/client';
import { GET_VEHICLE_PERMISSIONS_QUERY, UPDATE_VEHICLE_PERMISSION_STATUS_MUTATION } from '@/lib/graphql/queries';
import type { VehiclePermission } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

const formatDateSafe = (dateString?: string | null, formatString: string = 'dd/MM/yyyy') => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), formatString, { locale: it });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Data non valida';
  }
};

export default function PermessiVeicoliPage() {
  const [permissions, setPermissions] = useState<VehiclePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionToUpdate, setPermissionToUpdate] = useState<VehiclePermission | null>(null);
  const [newStatusToSet, setNewStatusToSet] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  const fetchPermissions = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient<{ vehicle_permissions: VehiclePermission[] }>(GET_VEHICLE_PERMISSIONS_QUERY);
      if (response.errors) {
        console.error("GraphQL errors fetching vehicle permissions:", response.errors);
        toast({ title: "Errore Caricamento Permessi", description: `Impossibile caricare i permessi: ${response.errors[0].message}`, variant: "destructive" });
        setPermissions([]);
      } else if (response.data && response.data.vehicle_permissions) {
        setPermissions(response.data.vehicle_permissions);
      } else {
        toast({ title: "Errore Dati Permessi", description: "Nessun dato sui permessi ricevuto.", variant: "destructive" });
        setPermissions([]);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle permissions:", error);
      toast({ title: "Errore di Rete", description: "Impossibile connettersi al server per caricare i permessi.", variant: "destructive" });
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const getStatusVariant = (status: VehiclePermission['status']): "default" | "secondary" | "destructive" => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const openUpdateConfirmation = (permission: VehiclePermission, newStatus: 'APPROVED' | 'REJECTED') => {
    setPermissionToUpdate(permission);
    setNewStatusToSet(newStatus);
    setIsAlertDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!permissionToUpdate || !newStatusToSet) return;

    setIsProcessing(true);
    try {
      const response = await apiClient(UPDATE_VEHICLE_PERMISSION_STATUS_MUTATION, {
        id: permissionToUpdate.id,
        status: newStatusToSet,
      });

      if (response.errors || !response.data?.update_vehicle_permissions_by_pk) {
        console.error("GraphQL errors updating permission status:", response.errors);
        toast({ title: "Errore Aggiornamento Stato", description: `Impossibile aggiornare lo stato: ${response.errors?.[0]?.message || 'Errore sconosciuto'}`, variant: "destructive" });
      } else {
        toast({ title: "Stato Aggiornato", description: `Il permesso per ${permissionToUpdate.plate} è stato ${newStatusToSet === 'APPROVED' ? 'approvato' : 'rifiutato'}.` });
        setPermissions(prev =>
          prev.map(p =>
            p.id === permissionToUpdate.id ? { ...p, status: newStatusToSet } : p
          )
        );
      }
    } catch (error) {
      console.error("Failed to update permission status:", error);
      toast({ title: "Errore di Rete", description: "Impossibile connettersi al server per aggiornare lo stato.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setIsAlertDialogOpen(false);
      setPermissionToUpdate(null);
      setNewStatusToSet(null);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Caricamento permessi veicoli...</span>
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">Gestione Permessi Veicoli</CardTitle>
          <CardDescription>Visualizza e gestisci i permessi di circolazione per i veicoli.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Richiedente</TableHead>
                <TableHead>Email Richiesta</TableHead>
                <TableHead>Targa</TableHead>
                <TableHead>Modello</TableHead>
                <TableHead>Inizio Validità</TableHead>
                <TableHead>Fine Validità</TableHead>
                <TableHead>Data Richiesta Permesso</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell className="font-medium">
                    {permission.user ? (
                      <Link href={`/utenti/${permission.user}/richieste`} className="text-primary hover:underline">
                        {`${permission.first_name || ''} ${permission.last_name || ''}`.trim() || 'N/D'}
                      </Link>
                    ) : (
                      `${permission.first_name || ''} ${permission.last_name || ''}`.trim() || '-'
                    )}
                  </TableCell>
                  <TableCell>{permission.email || '-'}</TableCell>
                  <TableCell>{permission.plate || '-'}</TableCell>
                  <TableCell>{permission.model || '-'}</TableCell>
                  <TableCell>{formatDateSafe(permission.start_date)}</TableCell>
                  <TableCell>{formatDateSafe(permission.end_date)}</TableCell>
                  <TableCell>{formatDateSafe(permission.created_at, 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(permission.status)}>
                      {permission.status || 'Sconosciuto'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {permission.url ? (
                      <Button variant="link" asChild className="p-0 h-auto">
                        <a href={permission.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                          Visualizza <ExternalLink className="ml-1 h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {permission.status?.toUpperCase() === 'PENDING' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Apri menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openUpdateConfirmation(permission, 'APPROVED')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            Approva
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openUpdateConfirmation(permission, 'REJECTED')} className="text-destructive focus:text-destructive">
                            <XCircle className="mr-2 h-4 w-4" />
                            Rifiuta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {permissions.length === 0 && !loading && (
            <p className="text-center py-4 text-muted-foreground">Nessun permesso veicolo trovato.</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Azione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler {newStatusToSet === 'APPROVED' ? 'approvare' : 'rifiutare'} il permesso per la targa {permissionToUpdate?.plate}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsAlertDialogOpen(false); setPermissionToUpdate(null); setNewStatusToSet(null); }} disabled={isProcessing}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateStatus} disabled={isProcessing} className={newStatusToSet === 'REJECTED' ? "bg-destructive hover:bg-destructive/90" : ""}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {newStatusToSet === 'APPROVED' ? 'Approva' : 'Rifiuta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

