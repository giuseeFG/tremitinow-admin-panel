
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Loader2, ArrowLeft, ExternalLink, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiClient } from '@/lib/graphql/client';
import { GET_USER_FOR_REQUESTS_PAGE_QUERY, GET_VEHICLE_PERMISSIONS_BY_USER_ID_QUERY, UPDATE_VEHICLE_PERMISSION_STATUS_MUTATION } from '@/lib/graphql/queries';
import type { User, VehiclePermission } from '@/types';
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

export default function UserVehiclePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId ? parseInt(params.userId as string, 10) : null;

  const [user, setUser] = useState<Partial<User> | null>(null);
  const [permissions, setPermissions] = useState<VehiclePermission[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionToUpdate, setPermissionToUpdate] = useState<VehiclePermission | null>(null);
  const [newStatusToSet, setNewStatusToSet] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  const fetchUserDataAndPermissions = React.useCallback(async () => {
    if (!userId) {
      toast({ title: "ID Utente non valido", variant: "destructive" });
      setLoadingUser(false);
      return;
    }
    setLoadingUser(true);
    setLoadingPermissions(true);
    try {
      const userResponse = await apiClient<{ users_by_pk: Partial<User> }>(
        GET_USER_FOR_REQUESTS_PAGE_QUERY,
        { id: userId }
      );

      if (userResponse.errors || !userResponse.data?.users_by_pk) {
        toast({ title: "Errore Caricamento Utente", description: userResponse.errors?.[0].message || "Utente non trovato.", variant: "destructive" });
        setUser(null);
        setLoadingUser(false);
        setLoadingPermissions(false);
        return;
      }
      
      const fetchedUser = userResponse.data.users_by_pk;
      setUser(fetchedUser);
      setLoadingUser(false);

      const permissionsResponse = await apiClient<{ vehicle_permissions: VehiclePermission[] }>(
        GET_VEHICLE_PERMISSIONS_BY_USER_ID_QUERY,
        { userId: userId }
      );

      if (permissionsResponse.errors) {
        toast({ title: "Errore Caricamento Permessi Veicolo", description: permissionsResponse.errors[0].message, variant: "destructive" });
        setPermissions([]);
      } else if (permissionsResponse.data && permissionsResponse.data.vehicle_permissions) {
        setPermissions(permissionsResponse.data.vehicle_permissions);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error("Failed to fetch user data or vehicle permissions:", error);
      toast({ title: "Errore di Rete", description: "Impossibile connettersi al server.", variant: "destructive" });
      setUser(null);
      setPermissions([]);
    } finally {
      setLoadingUser(false);
      setLoadingPermissions(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchUserDataAndPermissions();
  }, [fetchUserDataAndPermissions]);

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


  if (loadingUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Caricamento dati utente...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-semibold text-destructive">Utente non trovato</h1>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Indietro
        </Button>
      </div>
    );
  }

  const userDisplayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || `ID: ${user.id}`;

  return (
    <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push('/permessi-veicoli')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna a Permessi Veicoli
        </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">
            Permessi Veicolo Richiesti da: {userDisplayName}
          </CardTitle>
          {user.email && <CardDescription>Email utente: {user.email}</CardDescription>}
        </CardHeader>
        <CardContent>
          {loadingPermissions ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Caricamento permessi...</span>
            </div>
          ) : permissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Richiesta</TableHead>
                  <TableHead>Targa</TableHead>
                  <TableHead>Modello</TableHead>
                  <TableHead>Inizio Validità</TableHead>
                  <TableHead>Fine Validità</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>{formatDateSafe(permission.created_at, 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{permission.plate || '-'}</TableCell>
                    <TableCell>{permission.model || '-'}</TableCell>
                    <TableCell>{formatDateSafe(permission.start_date)}</TableCell>
                    <TableCell>{formatDateSafe(permission.end_date)}</TableCell>
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
          ) : (
            <p className="text-center py-10 text-muted-foreground">Nessun permesso veicolo trovato per questo utente.</p>
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
    </div>
  );
}

