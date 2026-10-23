import { deleteMyStravaData, disconnectStrava, saveShareStats } from '@/lib/strava/accountActions'

const DANGER_BUTTON_CLASS = 'min-h-11 w-full rounded-lg border border-danger px-4 font-bold text-danger'

function ShareStatsForm({ shared }: { shared: boolean }) {
  return (
    <form action={saveShareStats} className="flex flex-col gap-3">
      <label className="flex items-start gap-3">
        <input type="checkbox" name="share_stats_with_club" defaultChecked={shared} className="mt-1 size-5 shrink-0" />
        <span className="text-sm">
          Cho phép thành viên CLR khác xem tổng km, pace và thứ hạng của tôi. Không tick thì thành viên khác chỉ thấy
          tên tôi, không thấy số liệu. Bản đồ hoạt động luôn chỉ mình tôi xem được.
        </span>
      </label>
      <button type="submit" className="min-h-11 rounded-lg bg-brand px-4 font-bold text-white">
        Lưu
      </button>
    </form>
  )
}

function ConfirmAction({ title, warning, action }: { title: string; warning: string; action: () => Promise<void> }) {
  return (
    <details className="rounded-lg border border-line p-3">
      <summary className="min-h-11 cursor-pointer py-2 font-bold">{title}</summary>
      <form action={action} className="mt-2 flex flex-col gap-3">
        <p className="text-sm text-muted">{warning}</p>
        <button type="submit" className={DANGER_BUTTON_CLASS}>
          Xác nhận: {title.toLowerCase()}
        </button>
      </form>
    </details>
  )
}

export default function StravaSettings({ shared }: { shared: boolean }) {
  return (
    <section className="mt-8 flex flex-col gap-4">
      <h2 className="text-lg font-black">Strava</h2>
      <ShareStatsForm shared={shared} />
      <ConfirmAction
        title="Xoá toàn bộ dữ liệu Strava của tôi"
        warning="Xoá mọi hoạt động đã đồng bộ về CLR và dừng kéo lịch sử. Hoạt động mới trên Strava vẫn được đồng bộ tiếp."
        action={deleteMyStravaData}
      />
      <ConfirmAction
        title="Ngắt kết nối Strava"
        warning="Thu hồi quyền của CLR trên Strava và xoá toàn bộ hoạt động đã đồng bộ. Đăng nhập lại bằng Strava để kết nối lại."
        action={disconnectStrava}
      />
    </section>
  )
}
