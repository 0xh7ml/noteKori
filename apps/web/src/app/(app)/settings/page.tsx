'use client'

import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'BDT', label: 'Bangladeshi Taka (৳)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
]

const schema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  email: z.string().email('Valid email required'),
  currency: z.string().length(3),
})
type FormValues = z.infer<typeof schema>

export default function SettingsPage() {
  const { data: profile, isLoading: isLoadingProfile } = useProfile()
  const updateProfile = useUpdateProfile()

  // Use memo to prevent unnecessary re-renders
  const defaultCurrency = useMemo(() => profile?.currency || 'USD', [profile?.currency])

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || '',
      currency: defaultCurrency,
    },
  })

  // Initialize form values when profile data changes
  useEffect(() => {
    if (profile) {
      setValue('name', profile.name)
      setValue('email', profile.email)
      setValue('currency', profile.currency || 'USD')
    }
  }, [profile, setValue])

  const onSubmit = async (values: FormValues) => {
    try {
      await updateProfile.mutateAsync(values)
      toast.success('Profile updated successfully')
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to update'
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
  }

  if (isLoadingProfile) return <div className="text-center py-8">Loading...</div>
  if (!profile) return null

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your basic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize how NoteKori displays your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                key={defaultCurrency}
                defaultValue={defaultCurrency}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(({ code, label }) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Choose your preferred currency for display</p>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}