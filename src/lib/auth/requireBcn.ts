import 'server-only'
import { redirect } from 'next/navigation'
import { getCurrentMember, type CurrentMember } from '@/lib/auth/currentMember'

export async function requireBcn(): Promise<CurrentMember> {
  const member = await getCurrentMember()
  if (!member) redirect('/login')
  if (member.role !== 'bcn' || member.status !== 'active') redirect('/')
  return member
}
