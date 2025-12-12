// app/admin/registrations/page.tsx
"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface RegistrationRequest {
  id: string
  email: string
  status: string
  requested_at: string
}

export default function RegistrationsPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("registration_requests")
        .select("*")
        .eq("status", "pending")
        .order("requested_at", { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al cargar solicitudes"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenApprove = (request: RegistrationRequest) => {
    setSelectedRequest(request)
    setShowApproveDialog(true)
  }

  const confirmApprove = async () => {
    if (!selectedRequest) return

    setIsApproving(true)
    try {
      const res = await fetch("/api/admin/registrations/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: selectedRequest.id }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error al aprobar")

      toast({
        title: "Aprobado",
        description: `Usuario ${selectedRequest.email} ha sido aprobado`,
      })

      setShowApproveDialog(false)
      setSelectedRequest(null)
      fetchRequests()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al aprobar"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async (request: RegistrationRequest) => {
    // Ask for optional reason
    const reason = window.prompt(`Motivo de rechazo para ${request.email} (opcional):`, "")

    if (reason === null) {
      // user cancelled
      return
    }

    setIsRejecting(true)
    try {
      const res = await fetch("/api/admin/registrations/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id, reason: reason || null }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error al rechazar")

      toast({
        title: "Rechazado",
        description: `Solicitud de ${request.email} ha sido rechazada`,
      })

      fetchRequests()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al rechazar"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsRejecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Cargando solicitudes...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Registro</CardTitle>
          <CardDescription>Aprueba o rechaza solicitudes de registro pendientes</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay solicitudes pendientes</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha Solicitado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>{new Date(request.requested_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.status}</Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" onClick={() => handleOpenApprove(request)} disabled={isApproving}>
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request)}
                        disabled={isRejecting}
                      >
                        Rechazar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showApproveDialog} onOpenChange={(open) => !open && setShowApproveDialog(false)}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirmar Aprobación</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas aprobar a {selectedRequest?.email}? Se creará una cuenta de administrador y se
            enviará un correo con instrucciones.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel onClick={() => setShowApproveDialog(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove} disabled={isApproving}>
              {isApproving ? "Aprobando..." : "Aprobar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
