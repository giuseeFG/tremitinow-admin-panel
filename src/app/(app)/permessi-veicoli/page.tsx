
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PermessiVeicoliPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestione Permessi Veicoli</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Permessi Veicoli</CardTitle>
          <CardDescription>
            Visualizza e gestisci i permessi di circolazione per i veicoli.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Contenuto della pagina Permessi Veicoli. (Placeholder)
          </p>
          {/* TODO: Implement UI for managing vehicle permits */}
        </CardContent>
      </Card>
    </div>
  );
}
