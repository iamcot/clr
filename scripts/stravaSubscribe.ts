// Quản lý webhook subscription của Strava: node --env-file=.env.local scripts/stravaSubscribe.ts <create|list|delete [id]>
const SUBSCRIPTION_URL = 'https://www.strava.com/api/v3/push_subscriptions'

function readEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`)
  return value
}

function credentials() {
  return { client_id: readEnv('STRAVA_CLIENT_ID'), client_secret: readEnv('STRAVA_CLIENT_SECRET') }
}

async function show(response: Response) {
  console.log(response.status, await response.text())
  if (!response.ok) process.exitCode = 1
}

async function listSubscriptions() {
  await show(await fetch(`${SUBSCRIPTION_URL}?${new URLSearchParams(credentials())}`))
}

async function createSubscription() {
  const body = new URLSearchParams({
    ...credentials(),
    callback_url: `${readEnv('APP_URL').replace(/\/$/, '')}/api/strava/webhook`,
    verify_token: readEnv('STRAVA_WEBHOOK_VERIFY_TOKEN'),
  })
  await show(await fetch(SUBSCRIPTION_URL, { method: 'POST', body }))
}

async function deleteSubscription(id: string | undefined) {
  if (!id) throw new Error('Cần id subscription (lấy bằng lệnh list)')
  await show(await fetch(`${SUBSCRIPTION_URL}/${id}?${new URLSearchParams(credentials())}`, { method: 'DELETE' }))
}

const [command, argument] = process.argv.slice(2)
const commands: Record<string, () => Promise<void>> = {
  list: listSubscriptions,
  create: createSubscription,
  delete: () => deleteSubscription(argument),
}

const run = command ? commands[command] : undefined
if (!run) {
  console.error('Dùng: create | list | delete <id>')
  process.exit(1)
}
await run()

export {}
