
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
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiClient } from '@/lib/graphql/client';
import { GET_USER_FOR_REQUESTS_PAGE_QUERY, GET_REQUESTS_BY_EMAIL_QUERY } from '@/lib/graphql/queries';
import type { AppRequest, User } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const formatDateSafe = (dateString?: string | null, formatString: string = 'dd/MM/yyyy HH:mm') => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), formatString, { locale: it });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Data non valida';
  }
};

export default function UserRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId ? parseInt(params.userId as string, 10) : null;

  const [user, setUser] = useState<Partial<User> | null>(null);
  const [requests, setRequests] = useState<AppRequest[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      toast({ title: "ID Utente non valido", variant: "destructive" });
      setLoadingUser(false);
      return;
    }

    const fetchUserData = async () => {
      setLoadingUser(true);
      setLoadingRequests(true); // Start loading requests indicator
      try {
        const userResponse = await apiClient<{ users_by_pk: Partial<User> }>(
          GET_USER_FOR_REQUESTS_PAGE_QUERY,
          { id: userId }
        );

        if (userResponse.errors || !userResponse.data?.users_by_pk) {
          toast({ title: "Errore Caricamento Utente", description: userResponse.errors?.[0].message || "Utente non trovato.", variant: "destructive" });
          setUser(null);
          setLoadingUser(false);
          setLoadingRequests(false);
          return;
        }
        
        const fetchedUser = userResponse.data.users_by_pk;
        setUser(fetchedUser);
        setLoadingUser(false);

        if (fetchedUser.email) {
          const requestsResponse = await apiClient<{ form_requests: AppRequest[] }>(
            GET_REQUESTS_BY_EMAIL_QUERY,
            { email: fetchedUser.email }
          );

          if (requestsResponse.errors) {
            toast({ title: "Errore Caricamento Richieste", description: requestsResponse.errors[0].message, variant: "destructive" });
            setRequests([]);
          } else if (requestsResponse.data && requestsResponse.data.form_requests) {
            setRequests(requestsResponse.data.form_requests);
          } else {
            setRequests([]);
          }
        } else {
          toast({ title: "Email Utente Mancante", description: "Impossibile caricare le richieste senza un indirizzo email per l'utente.", variant: "destructive" });
          setRequests([]);
        }
      } catch (error) {
        console.error("Failed to fetch user data or requests:", error);
        toast({ title: "Errore di Rete", description: "Impossibile connettersi al server.", variant: "destructive" });
        setUser(null);
        setRequests([]);
      } finally {
        setLoadingUser(false);
        setLoadingRequests(false);
      }
    };

    fetchUserData();
  }, [userId, toast]);

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
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna a Permessi Veicoli
        </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">
            Richieste Inoltrate da: {userDisplayName}
          </CardTitle>
          {user.email && <CardDescription>Email: {user.email}</CardDescription>}
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Caricamento richieste...</span>
            </div>
          ) : requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome pagina</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Categoria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{formatDateSafe(request.created_at)}</TableCell>
                    <TableCell>{request.page_name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{request.notes || '-'}</TableCell>
                    <TableCell>{request.category?.category || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-10 text-muted-foreground">Nessuna richiesta trovata per questo utente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
