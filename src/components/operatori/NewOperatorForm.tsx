
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
import { registerFirebaseUser, sendPasswordReset } from "@/lib/firebase/auth"; // Import registerFirebaseUser
import type { User as AppUser } from "@/types";

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
    let firebaseUserUid = '';

    try {
      console.log("Attempting to create user in Firebase Auth with email:", data.email);
      const firebaseUser = await registerFirebaseUser(data.email, data.password);
      if (!firebaseUser) { // registerFirebaseUser now directly returns FirebaseUser or throws
        throw new Error("Firebase user creation failed or user data not returned.");
      }
      firebaseUserUid = firebaseUser.uid;
      toast({ title: "Utente Firebase Creato", description: `UID: ${firebaseUserUid}` });
      console.log("Firebase user created successfully, UID:", firebaseUserUid);

      const newUserPayload: Partial<AppUser> & { email: string; role: string } = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        role: 'operator', 
        firebaseId: firebaseUserUid,
        status: 'ACTIVE', // Default status
      };
      console.log("Payload for backend /registerUser:", newUserPayload);

      const backendRegisterUrl = process.env.NEXT_PUBLIC_FIREBASE_BASE_URL + '/registerUser';
      console.log("Attempting to register user in backend via:", backendRegisterUrl);
      const backendResponse = await fetch(backendRegisterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ object: newUserPayload }), 
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.text();
        console.error("Backend registration error:", backendResponse.status, errorData);
        // Attempt to delete Firebase user if backend registration fails
        // This part is tricky and might need a backend mechanism for robustness
        // For now, we'll log and notify, but actual Firebase user deletion on failure here can be complex
        // await deleteFirebaseUser(firebaseUserUid); // Placeholder for a potential cleanup
        throw new Error(`Backend registration failed: ${backendResponse.status} ${errorData}. Firebase user ${firebaseUserUid} was created but backend sync failed.`);
      }
      
      const backendResult = await backendResponse.json(); 
      console.log("Backend registration successful:", backendResult);
      toast({ title: "Operatore Registrato nel DB", description: `L'operatore ${data.firstName} ${data.lastName} è stato registrato.` });
      
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
          <Button type="button" variant="outline" onClick={() => { form.reset(); onOperatorCreated();}} disabled={isSubmitting}>
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
