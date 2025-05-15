
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function TasseSbarcoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestione Tasse di Sbarco</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Tasse di Sbarco</CardTitle>
          <CardDescription>
            Visualizza e gestisci le informazioni relative alle tasse di sbarco.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Contenuto della pagina Tasse di Sbarco. (Placeholder)
          </p>
          {/* TODO: Implement UI for managing landing fees */}
        </CardContent>
      </Card>
    </div>
  );
}
