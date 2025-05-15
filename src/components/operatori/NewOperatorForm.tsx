
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
import { createUserInFirebaseAuth, sendPasswordReset } from "@/lib/firebase/auth"; // Import createUserInFirebaseAuth
import type { User as AppUser } from "@/types";

const newOperatorSchema = z.object({
  firstName: z.string().min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  lastName: z.string().min(2, { message: "Il cognome deve contenere almeno 2 caratteri." }),
  email: z.string().email({ message: "Inserisci un indirizzo email valido." }),
  password: z.string().min(6, { message: "La password deve contenere almeno 6 caratteri." }),
});

type NewOperatorFormData = z.infer<typeof newOperatorSchema>;

interface NewOperatorFormProps {
  onOperatorCreated: () => void; // Callback to close dialog and potentially refresh list
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
    let firebaseUserUid = '';

    try {
      // 1. Create user in Firebase Auth using the Client SDK
      console.log("Attempting to create user in Firebase Auth with email:", data.email);
      const firebaseUserCredential = await createUserInFirebaseAuth(data.email, data.password);
      if (!firebaseUserCredential || !firebaseUserCredential.user) {
        throw new Error("Firebase user creation failed or user data not returned.");
      }
      firebaseUserUid = firebaseUserCredential.user.uid;
      toast({ title: "Utente Firebase Creato", description: `UID: ${firebaseUserUid}` });
      console.log("Firebase user created successfully, UID:", firebaseUserUid);

      // 2. Prepare user data for your backend (Hasura)
      const newUserPayload: Partial<AppUser> & { email: string; role: string } = { // Ensure role is part of the payload
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        role: 'operator', // Explicitly set role
        firebaseId: firebaseUserUid,
        // status: 'ACTIVE', // Default status if your backend expects it
      };
      console.log("Payload for backend /registerUser:", newUserPayload);

      // 3. Register user in your database (e.g., Hasura via a Cloud Function or Action)
      // This currently simulates a fetch call. Replace with your actual API call (e.g., using axios if preferred and configured)
      const backendRegisterUrl = process.env.NEXT_PUBLIC_FIREBASE_BASE_URL + '/registerUser';
      console.log("Attempting to register user in backend via:", backendRegisterUrl);
      const backendResponse = await fetch(backendRegisterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add any necessary auth headers for this backend endpoint if required
        },
        body: JSON.stringify({ object: newUserPayload }), // Structure based on your example
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.text();
        console.error("Backend registration error:", backendResponse.status, errorData);
        throw new Error(`Backend registration failed: ${backendResponse.status} ${errorData}`);
      }
      
      const backendResult = await backendResponse.json(); // Assuming your backend returns JSON
      console.log("Backend registration successful:", backendResult);
      toast({ title: "Operatore Registrato nel DB", description: `L'operatore ${data.firstName} ${data.lastName} è stato registrato.` });
      
      // 4. Send password reset email
      console.log("Attempting to send password reset email to:", data.email);
      await sendPasswordReset(data.email);
      toast({
        title: "Email di Reset Password Inviata",
        description: `Un'email per impostare la password è stata inviata a ${data.email}.`,
      });
      console.log("Password reset email sent successfully.");

      form.reset();
      onOperatorCreated(); // Close dialog and trigger refresh

    } catch (error: any) {
      console.error("Error creating operator:", error);
      let errorMessage = "Errore durante la creazione dell'operatore.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Questo indirizzo email è già in uso.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Errore Creazione Operatore",
        description: errorMessage,
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
          <Button type="button" variant="outline" onClick={onOperatorCreated} disabled={isSubmitting}>
            Annulla
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Crea Operatore
          </Button>
        </div>
      </form>
    </Form>
  );
}
