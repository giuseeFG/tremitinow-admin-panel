
"use client";

import React, { useEffect, useState } from 'react';
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
import { Loader2, ExternalLink } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiClient } from '@/lib/graphql/client';
import { GET_VEHICLE_PERMISSIONS_QUERY } from '@/lib/graphql/queries';
import type { VehiclePermission } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

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

  useEffect(() => {
    const fetchPermissions = async () => {
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
    };
    fetchPermissions();
  }, [toast]);

  const getStatusVariant = (status: VehiclePermission['status']): "default" | "secondary" | "destructive" => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'default'; // Will use primary color
      case 'PENDING':
        return 'secondary'; // Will use accent color (or a grayish one depending on theme)
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
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
              <TableHead>Email</TableHead>
              <TableHead>Targa</TableHead>
              <TableHead>Modello</TableHead>
              <TableHead>Inizio Validità</TableHead>
              <TableHead>Fine Validità</TableHead>
              <TableHead>Data Richiesta</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Documento</TableHead>
              {/* <TableHead className="text-right">Azioni</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell className="font-medium">{`${permission.first_name || ''} ${permission.last_name || ''}`.trim() || '-'}</TableCell>
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
                {/* <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Azioni
                  </Button>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {permissions.length === 0 && !loading && (
          <p className="text-center py-4 text-muted-foreground">Nessun permesso veicolo trovato.</p>
        )}
      </CardContent>
    </Card>
  );
}
