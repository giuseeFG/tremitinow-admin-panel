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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";
import React from "react";

const newOperatorSchema = z.object({
  firstName: z.string().min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  lastName: z.string().min(2, { message: "Il cognome deve contenere almeno 2 caratteri." }),
  email: z.string().email({ message: "Inserisci un indirizzo email valido." }),
  // In a real app, you'd handle password creation more securely, possibly via an invite or a separate step
  // For this demo, we'll omit password from the form.
});

type NewOperatorFormData = z.infer<typeof newOperatorSchema>;

export function NewOperatorForm() {
  const { toast } = useToast();
  const router = useRouter();
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("Nuovo operatore dati (demo):", data);
    // In a real app, you would:
    // 1. Call an API endpoint or Firebase function to create the user.
    // 2. Handle password creation (e.g., auto-generate and send email, or require admin to set).
    // 3. Potentially update the local state or re-fetch the operators list.

    toast({
      title: "Operatore Creato (Demo)",
      description: `L'operatore ${data.firstName} ${data.lastName} è stato aggiunto con successo. (Password non impostata)`,
    });
    setIsSubmitting(false);
    form.reset(); // Reset form fields
    // Optionally redirect after a delay or provide a button to go back
    // router.push('/operatori'); 
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Dettagli Nuovo Operatore</CardTitle>
        <CardDescription>Compila i campi sottostanti per aggiungere un nuovo operatore.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
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
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/operatori')} disabled={isSubmitting}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salva Operatore
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
