"use client"

import { AuthPanel } from "@/components/auth/auth-panel"

type LoginFormProps = {
  notice?: string | null
  redirectTo?: string
  compact?: boolean
  onSuccess?: () => void
}

export function LoginForm({ notice, redirectTo, compact, onSuccess }: LoginFormProps) {
  return <AuthPanel compact={compact} notice={notice} onSuccess={onSuccess} redirectTo={redirectTo} />
}
