'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, AlertCircle } from 'lucide-react'
import { useCategories } from '@/hooks/use-categories'
import { CategoryForm } from '@/components/categories/category-form'
import { CategoryGrid } from '@/components/categories/category-grid'
import { LoadingSkeletonCard } from '@/components/shared/loading-skeleton'
import type { Category } from '@notekori/types'

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories()
  const [formOpen, setFormOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your transactions with custom and system categories
          </p>
        </div>
        <Button onClick={() => { setEditCat(null); setFormOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Category</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Categories</CardTitle>
          <CardDescription>
            Manage your income and expense categories. System categories are read-only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <LoadingSkeletonCard key={i} />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <p className="text-orange-800">No categories found. System categories should be loaded.</p>
            </div>
          ) : (
            <CategoryGrid
              categories={categories}
              onEdit={(cat) => { setEditCat(cat); setFormOpen(true) }}
            />
          )}
        </CardContent>
      </Card>

      <CategoryForm
        open={formOpen}
        onOpenChange={v => { setFormOpen(v); if (!v) setEditCat(null) }}
        category={editCat}
      />
    </div>
  )
}