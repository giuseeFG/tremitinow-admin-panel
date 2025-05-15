
"use client";

import React, { useState, useEffect } from "react";
import { getCategories } from "@/lib/pages";
import type { GroupCategory } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


interface CategoriesSelectorProps {
  selectedCategories: number[]; // Array of category IDs
  setSelectedCategories: React.Dispatch<React.SetStateAction<number[]>>;
}

function CategoriesSelector({ selectedCategories, setSelectedCategories }: CategoriesSelectorProps) {
  const [allCategories, setAllCategories] = useState<GroupCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      const data = await getCategories();
      setAllCategories(data);
      setLoading(false);
    }
    loadCategories();
  }, []);

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategories((prevSelected: number[]) =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter((id) => id !== categoryId)
        : [...prevSelected, categoryId]
    );
  };

  if (loading) {
    return (
      <div className="mt-6">
        <Label className="block text-foreground font-medium mb-2">Categorie</Label>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <Label className="block text-foreground font-medium mb-2">Categorie</Label>
      <Card className="border-border">
        <CardContent className="p-4">
          {allCategories.length === 0 ? (
            <p className="text-muted-foreground">Nessuna categoria disponibile</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
              {allCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryChange(category.id)}
                  />
                  <Label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-normal text-foreground cursor-pointer flex-1"
                  >
                    {category.category}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CategoriesSelector;
