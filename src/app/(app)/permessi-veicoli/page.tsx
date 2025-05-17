
"use client";

import React, { useEffect, useState, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink, MoreHorizontal, CheckCircle, XCircle, CalendarIcon, Search, FilterX } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiClient } from '@/lib/graphql/client';
import { GET_VEHICLE_PERMISSIONS_QUERY, UPDATE_VEHICLE_PERMISSION_STATUS_MUTATION } from '@/lib/graphql/queries';
import type { VehiclePermission } from '@/types';
import { format, isValid, parseISO } from 'date-fns';
import type { DateRange } from 'react-day-picker';
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
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Data non valida';
    return format(date, formatString, { locale: it });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Data non valida';
  }
};

export default function PermessiVeicoliPage() {
  const [allPermissions, setAllPermissions] = useState<VehiclePermission[]>([]);
  const [filteredPermissions, setFilteredPermissions] = useState<VehiclePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionToUpdate, setPermissionToUpdate] = useState<VehiclePermission | null>(null);
  const [newStatusToSet, setNewStatusToSet] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>(''); // Empty string for 'All'

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient<{ vehicle_permissions: VehiclePermission[] }>(GET_VEHICLE_PERMISSIONS_QUERY);
      if (response.errors) {
        console.error("GraphQL errors fetching vehicle permissions:", response.errors);
        toast({ title: "Errore Caricamento Permessi", description: `Impossibile caricare i permessi: ${response.errors[0].message}`, variant: "destructive" });
        setAllPermissions([]);
      } else if (response.data && response.data.vehicle_permissions) {
        setAllPermissions(response.data.vehicle_permissions);
      } else {
        toast({ title: "Errore Dati Permessi", description: "Nessun dato sui permessi ricevuto.", variant: "destructive" });
        setAllPermissions([]);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle permissions:", error);
      toast({ title: "Errore di Rete", description: "Impossibile connettersi al server per caricare i permessi.", variant: "destructive" });
      setAllPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    let tempPermissions = [...allPermissions];

    // Date range filter (on created_at)
    if (dateRange?.from) {
      tempPermissions = tempPermissions.filter(p => {
        if (!p.created_at) return false;
        const permissionDate = parseISO(p.created_at);
        return isValid(permissionDate) && permissionDate >= dateRange.from!;
      });
    }
    if (dateRange?.to) {
      tempPermissions = tempPermissions.filter(p => {
        if (!p.created_at) return false;
        const permissionDate = parseISO(p.created_at);
        const toDate = new Date(dateRange.to!);
        toDate.setHours(23, 59, 59, 999); // Include the whole 'to' day
        return isValid(permissionDate) && permissionDate <= toDate;
      });
    }

    // User search filter
    if (userSearchTerm.trim() !== '') {
      const lowerSearchTerm = userSearchTerm.toLowerCase();
      tempPermissions = tempPermissions.filter(p =>
        (p.first_name?.toLowerCase().includes(lowerSearchTerm) ||
         p.last_name?.toLowerCase().includes(lowerSearchTerm) ||
         p.email?.toLowerCase().includes(lowerSearchTerm) ||
         p.plate?.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Status filter
    if (selectedStatus && selectedStatus !== 'ALL') {
      tempPermissions = tempPermissions.filter(p => p.status?.toUpperCase() === selectedStatus.toUpperCase());
    }

    setFilteredPermissions(tempPermissions);
  }, [allPermissions, dateRange, userSearchTerm, selectedStatus]);


  const getStatusVariant = (status: VehiclePermission['status']): "default" | "secondary" | "destructive" => {
    switch (status?.trim().toUpperCase()) {
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
        toast({ title: "Errore Aggiornamento Stato", description: `Impossibile aggiornare lo stato: ${response.errors?.[0]?.message || 'Errore sconosciuto'}`, variant: "destructive" });
      } else {
        toast({ title: "Stato Aggiornato", description: `Il permesso per ${permissionToUpdate.plate} è stato ${newStatusToSet === 'APPROVED' ? 'approvato' : 'rifiutato'}.` });
        // Update allPermissions which will trigger re-filtering
        setAllPermissions(prev =>
          prev.map(p =>
            p.id === permissionToUpdate.id ? { ...p, status: newStatusToSet } : p
          )
        );
      }
    } catch (error) {
      toast({ title: "Errore di Rete", description: "Impossibile connettersi al server per aggiornare lo stato.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setIsAlertDialogOpen(false);
      setPermissionToUpdate(null);
      setNewStatusToSet(null);
    }
  };

  const handleResetFilters = () => {
    setDateRange(undefined);
    setUserSearchTerm('');
    setSelectedStatus('');
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
          <div className="mb-6 p-4 border rounded-lg shadow-sm bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="date-range" className="mb-1 block text-sm font-medium text-muted-foreground">Filtra per Data Richiesta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-range"
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yy", { locale: it })} - {format(dateRange.to, "dd/MM/yy", { locale: it })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy", { locale: it })
                        )
                      ) : (
                        <span>Seleziona un intervallo</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={it}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="user-search" className="mb-1 block text-sm font-medium text-muted-foreground">Cerca Utente/Targa</Label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="user-search"
                        type="text"
                        placeholder="Nome, email, targa..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
              </div>

              <div>
                <Label htmlFor="status-select" className="mb-1 block text-sm font-medium text-muted-foreground">Filtra per Stato</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status-select">
                    <SelectValue placeholder="Tutti gli stati" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tutti gli stati</SelectItem>
                    <SelectItem value="PENDING">In Attesa</SelectItem>
                    <SelectItem value="APPROVED">Approvato</SelectItem>
                    <SelectItem value="REJECTED">Rifiutato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleResetFilters} variant="outline" className="w-full lg:w-auto">
                <FilterX className="mr-2 h-4 w-4" />
                Resetta Filtri
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Richiedente</TableHead>
                <TableHead>Email Richiesta</TableHead>
                <TableHead>Targa</TableHead>
                <TableHead>Modello</TableHead>
                <TableHead>Inizio Validità</TableHead>
                <TableHead>Fine Validità</TableHead>
                <TableHead>Data Richiesta</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.map((permission) => (
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
                    {permission.status?.trim().toUpperCase() === 'PENDING' ? (
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
                          <DropdownMenuItem onClick={() => openUpdateConfirmation(permission, 'REJECTED')} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
          {filteredPermissions.length === 0 && !loading && (
            <p className="text-center py-4 text-muted-foreground">Nessun permesso veicolo trovato con i filtri applicati.</p>
          )}
           {allPermissions.length > 0 && filteredPermissions.length === 0 && !loading && userSearchTerm === '' && !dateRange && selectedStatus === '' && (
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

    