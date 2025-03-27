"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOutIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"

// Loading skeleton for settings cards
function SettingsSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-9 w-28" />
              </div>

              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`field-${index}`} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-32" />
            </CardFooter>
          </Card>

          <div className="space-y-6">
            {/* Password Card Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`password-${index}`} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-36" />
              </CardFooter>
            </Card>

            {/* Account Actions Card Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsContent() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e preferências de conta.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {/* <AvatarImage src="/avatars/admin.jpg" alt="Admin" /> */}
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Alterar foto
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" defaultValue="Admin" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="admin@imobiliaria.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" defaultValue="(11) 99999-9999" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast.success("Perfil atualizado com sucesso!")}>Salvar alterações</Button>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Senha</CardTitle>
                <CardDescription>Altere sua senha para manter sua conta segura.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha atual</Label>
                  <Input id="current-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input id="new-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => toast.success("Senha atualizada com sucesso!")}>Atualizar senha</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações da conta</CardTitle>
                <CardDescription>Opções para gerenciar sua conta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Sair da conta</div>
                    <div className="text-sm text-muted-foreground">Encerre sua sessão atual.</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Você será redirecionado para a página de login.")}
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium text-destructive">Excluir conta</div>
                    <div className="text-sm text-muted-foreground">
                      Exclua permanentemente sua conta e todos os seus dados.
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const confirm = window.confirm(
                        "Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.",
                      )
                      if (confirm) {
                        toast.error("Conta excluída com sucesso.")
                      }
                    }}
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  )
}

