"use client"

import { useState } from "react"

import { LoginForm } from "@/components/auth/login-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type AuthDialogProps = {
  mode?: "login"
}

export function AuthDialog({ mode = "login" }: AuthDialogProps) {
  const [open, setOpen] = useState(false)

  return (
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button
          className={
            "h-auto bg-transparent px-2 py-1 text-sm font-normal text-slate-300 hover:bg-transparent hover:text-white"
          }
          variant="ghost"
        >
          Login
        </Button>
      } />
      <DialogContent className="max-w-[460px] p-5 sm:p-6">
        <DialogHeader className="sr-only">
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>Sign in to your account.</DialogDescription>
        </DialogHeader>
        <LoginForm compact onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
