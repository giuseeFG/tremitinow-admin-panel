
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
import type { User as AppUser } from "@/types";

const newOperatorSchema = z.object({
  firstName: z.string().min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  lastName: z.string().min(2, { message: "Il cognome deve contenere almeno 2 caratteri." }),
  email: z.string().email({ message: "Inserisci un indirizzo email valido." }),
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
    },
  });

  async function onSubmit(data: NewOperatorFormData) {
    setIsSubmitting(true);
    let firebaseUid: string | null = null;

    try {
      // Step 1: Call backend to create Firebase user
      const firebaseRegisterUrl = (process.env.NEXT_PUBLIC_FIREBASE_BASE_URL || 'https://europe-west3-tremti-n.cloudfunctions.net') + '/registerFirebaseUser';
      console.log("Attempting to register Firebase user via backend endpoint:", firebaseRegisterUrl, "with payload:", { email: data.email });

      const firebaseResponse = await fetch(firebaseRegisterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (!firebaseResponse.ok) {
        const errorText = await firebaseResponse.text();
        let errorData: any = errorText;
        try { errorData = JSON.parse(errorText); } catch (e) { /* errorData remains text */ }
        console.error("Backend Firebase registration error:", firebaseResponse.status, errorData);
        const message = typeof errorData === 'object' && errorData.message ? errorData.message :
                        (typeof errorData === 'string' && errorData.length > 0 ? errorData : `Errore HTTP: ${firebaseResponse.status}`);
        throw new Error(`Registrazione utente Firebase fallita: ${message}`);
      }

      const firebaseResult = await firebaseResponse.json();
      if (!firebaseResult || !firebaseResult.uid) {
        console.error("Backend Firebase registration did not return UID:", firebaseResult);
        throw new Error("L'endpoint di registrazione Firebase non ha restituito un UID.");
      }
      firebaseUid = firebaseResult.uid;
      console.log("Firebase user registered via backend, UID:", firebaseUid);

      // Step 2: Call backend to register user in database
      const newUserPayloadForDb: Partial<AppUser> & { firebaseId: string } = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        role: 'operator',
        firebaseId: firebaseUid
      };

      const backendDbRegisterUrl = (process.env.NEXT_PUBLIC_FIREBASE_BASE_URL || 'https://europe-west3-tremti-n.cloudfunctions.net') + '/registerUser';
      console.log("Attempting to register operator in DB via backend endpoint:", backendDbRegisterUrl, "with payload:", { object: newUserPayloadForDb });

      const dbResponse = await fetch(backendDbRegisterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ object: newUserPayloadForDb }),
      });

      if (!dbResponse.ok) {
        const errorText = await dbResponse.text();
        let errorData: any = errorText;
        try { errorData = JSON.parse(errorText); } catch (e) { /* errorData remains text */ }
        console.error("Backend DB registration error:", dbResponse.status, errorData);
        const message = typeof errorData === 'object' && errorData.message ? errorData.message :
                        (typeof errorData === 'string' && errorData.length > 0 ? errorData : `Errore HTTP: ${dbResponse.status}`);
        throw new Error(`Registrazione operatore nel database fallita: ${message}`);
      }

      const dbResult = await dbResponse.json();
      console.log("Operator registered in DB via backend:", dbResult);
      toast({ title: "Operatore Registrato", description: `L'operatore ${data.firstName} ${data.lastName} è stato creato.` });

      // Step 3: Send password reset email
      console.log("Attempting to send password reset email to:", data.email);
      await sendPasswordReset(data.email);
      toast({
        title: "Email di Reset Password Inviata",
        description: `Un'email per impostare la password è stata inviata a ${data.email}.`,
      });
      console.log("Password reset email sent successfully.");

      form.reset();
      if (typeof onOperatorCreated === 'function') {
        onOperatorCreated();
      } else {
        console.error("BUG: onOperatorCreated prop was not a function when called in NewOperatorForm. Value:", onOperatorCreated);
        throw new Error("Callback per operatore creato non è disponibile.");
      }

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
                <Input placeholder="Mario" {...field} disabled={isSubmitting} />
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
                <Input placeholder="Rossi" {...field} disabled={isSubmitting} />
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
                <Input type="email" placeholder="m.rossi@example.com" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Creazione in corso...' : 'Crea Operatore'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
