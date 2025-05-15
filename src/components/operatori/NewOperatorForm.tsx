
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import React from "react";
import { sendPasswordReset } from "@/lib/firebase/auth"; 
// Rimuoviamo l'import di registerFirebaseUser perché la creazione utente Firebase è gestita dal backend

const newOperatorSchema = z.object({
  firstName: z.string().min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  lastName: z.string().min(2, { message: "Il cognome deve contenere almeno 2 caratteri." }),
  email: z.string().email({ message: "Inserisci un indirizzo email valido." }),
  password: z.string().min(6, { message: "La password deve contenere almeno 6 caratteri." }),
});

type NewOperatorFormData = z.infer<typeof newOperatorSchema>;

interface NewOperatorFormProps {
  onOperatorCreated: () => void; 
}

export function NewOperatorForm({ onOperatorCreated }: NewOperatorFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<NewOperatorFormData>({
    resolver: zodResolver(newOperatorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: NewOperatorFormData) {
    setIsSubmitting(true);

    try {
      const newUserPayload = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password, // La password viene inviata al backend
        role: 'operator', 
        // Il backend si occuperà di creare l'utente Firebase e ottenere/salvare il firebaseId
      };

      console.log("Payload for backend /registerUser:", newUserPayload);

      const backendRegisterUrl = process.env.NEXT_PUBLIC_FIREBASE_BASE_URL + '/registerUser';
      console.log("Attempting to register operator via backend endpoint:", backendRegisterUrl);
      
      const backendResponse = await fetch(backendRegisterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Qui potresti voler aggiungere un token di autorizzazione se il tuo endpoint /registerUser lo richiede
          // Ad esempio, se solo un admin può creare altri operatori.
        },
        body: JSON.stringify({ object: newUserPayload }), // Assumendo che il backend si aspetti un oggetto 'object'
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => backendResponse.text()); // Prova a parsare JSON, altrimenti testo
        console.error("Backend registration error:", backendResponse.status, errorData);
        throw new Error(typeof errorData === 'object' && errorData.message ? errorData.message : `Registrazione operatore fallita: ${errorData}`);
      }
      
      const backendResult = await backendResponse.json(); 
      console.log("Backend registration successful:", backendResult);
      toast({ title: "Operatore Registrato", description: `L'operatore ${data.firstName} ${data.lastName} è stato creato.` });
      
      // Invio email di reset password (presumendo che il backend non lo faccia)
      // Se il backend restituisce il firebaseId, potresti volerlo usare o confermare l'email.
      console.log("Attempting to send password reset email to:", data.email);
      await sendPasswordReset(data.email);
      toast({
        title: "Email di Reset Password Inviata",
        description: `Un'email per impostare la password è stata inviata a ${data.email}.`,
      });
      console.log("Password reset email sent successfully.");

      form.reset();
      onOperatorCreated(); 

    } catch (error: any) {
      console.error("Error creating operator:", error);
      toast({
        title: "Errore Creazione Operatore",
        description: error.message || "Si è verificato un errore imprevisto.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Mario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cognome</FormLabel>
              <FormControl>
                <Input placeholder="Rossi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="m.rossi@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          {/* Potresti voler aggiungere un pulsante Annulla che chiama onOperatorCreated senza fare nulla, o che resetta il form */}
          {/* <Button type="button" variant="outline" onClick={() => { form.reset(); onOperatorCreated();}} disabled={isSubmitting}>
            Annulla
          </Button> */}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Crea Operatore
          </Button>
        </div>
      </form>
    </Form>
  );
}
