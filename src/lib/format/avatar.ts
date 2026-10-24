// Strava đôi khi trả đường dẫn tương đối ("avatar/athlete/large.png") thay cho ảnh thật
export function validAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}
