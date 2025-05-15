
"use client";
import type { AppRequest } from '@/types'; // Updated to AppRequest
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
import { Eye, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/graphql/client';
import { GET_REQUESTS_QUERY } from '@/lib/graphql/queries';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function RichiestePage() {
  const [requests, setRequests] = useState<AppRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const response = await apiClient<{ form_requests: any[] }>(GET_REQUESTS_QUERY);
        if (response.errors) {
          console.error("GraphQL errors fetching requests:", response.errors);
          toast({ title: "Errore Caricamento Richieste", description: `Impossibile caricare le richieste: ${response.errors[0].message}`, variant: "destructive" });
          setRequests([]);
          return;
        }
        if (response.data && response.data.form_requests) {
          const fetchedRequests: AppRequest[] = response.data.form_requests.map(fr => ({
            id: fr.id,
            email: fr.email,
            page_name: fr.page_name,
            notes: fr.notes,
            created_at: fr.created_at,
            category: fr.category ? { category: fr.category.category } : null,
          }));
          setRequests(fetchedRequests);
        } else {
           toast({ title: "Errore Dati Richieste", description: "Nessun dato richiesta ricevuto.", variant: "destructive" });
           setRequests([]);
        }
      } catch (error) {
        console.error("Failed to fetch requests:", error);
        toast({ title: "Errore di Rete", description: "Impossibile connettersi al server per caricare le richieste.", variant: "destructive" });
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Caricamento richieste...</span>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">Gestione Richieste</CardTitle>
        <CardDescription>Visualizza le richieste pervenute, ordinate per data decrescente.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Nome pagina</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  {request.created_at ? format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: it }) : '-'}
                </TableCell>
                <TableCell className="font-medium">{request.email}</TableCell>
                <TableCell>{request.page_name || '-'}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">{request.notes || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {requests.length === 0 && !loading && (
          <p className="text-center py-4 text-muted-foreground">Nessuna richiesta trovata.</p>
        )}
      </CardContent>
    </Card>
  );
}
