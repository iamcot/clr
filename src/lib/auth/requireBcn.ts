import 'server-only'
import { notFound } from 'next/navigation'
import { getCurrentMember, type CurrentMember } from '@/lib/auth/currentMember'

export async function getBcnMember(): Promise<CurrentMember | null> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'bcn' || member.status !== 'active') return null
  return member
}

export async function requireBcn(): Promise<CurrentMember> {
  const member = await getBcnMember()
  if (!member) notFound()
  return member
}
