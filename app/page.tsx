"use client"

import Link from "next/link"
import Image from "next/image"
import { HomeIcon } from "lucide-react"
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  SignUpButton, 
  useAuth 
} from "@clerk/nextjs"

import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-[520px] flex-col items-center justify-center gap-6 px-4 py-10">
        <div className="flex flex-col items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="ImobSystem Logo" 
            width={100} 
            height={100}
            className="mb-2"
          />
          {/* <h1 className="text-3xl font-bold">ImobSystem</h1> */}
        </div>
        
        <p className="text-center text-lg text-muted-foreground">
          Sistema de gerenciamento de vendas e visitas imobiliárias
        </p>
        
        <div className="grid w-full gap-4">
          <SignedIn>
            <LoggedInOptions />
          </SignedIn>
          
          <SignedOut>
            <LoggedOutOptions />
          </SignedOut>
        </div>
      </div>
    </div>
  )
}

function LoggedInOptions() {
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Menu Principal</CardTitle>
          <CardDescription>Acesse as principais funcionalidades do sistema</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Link href="/dashboard" className="w-full">
            <Button className="w-full justify-start gap-2" variant="outline" size="lg">
              <HomeIcon className="h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          <Link href="/agents" className="w-full">
            <Button className="w-full justify-start gap-2" variant="outline" size="lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              <title>Corretores</title>
              </svg>
              Corretores
            </Button>
          </Link>
          <Link href="/visits" className="w-full">
            <Button className="w-full justify-start gap-2" variant="outline" size="lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
              <title>Visitas</title>
              </svg>
              Visitas
            </Button>
          </Link>
        </CardContent>
      </Card>
    </>
  )
}

function LoggedOutOptions() {
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Acesse sua Conta</CardTitle>
          <CardDescription>Faça login para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SignInButton mode="modal">
            <Button className="w-full" size="lg">
              Entrar
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button className="w-full" variant="outline" size="lg">
              Criar uma conta
            </Button>
          </SignUpButton>
        </CardContent>
      </Card>
    </>
  )
}