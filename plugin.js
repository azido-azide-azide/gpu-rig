// gpu-rig — live rig status in the desktop status bar (bottom ribbon):
//   1. which model is currently loaded in GPU memory (nInfer / basalt),
//   2. per-GPU core utilisation (nvidia-smi on the PVE host).
// Data comes from this plugin's own gateway backend (/api/plugins/gpu-rig/rig).

import { STATUSBAR_AREAS, useQuery } from '@hermes/plugin-sdk'
import { jsx } from 'react/jsx-runtime'

const POLL_MS = 4000

function Chip({ ctx, kind }) {
  const { data } = useQuery({
    queryKey: ['gpu-rig', 'rig'],
    queryFn: () => ctx.rest('/rig'),
    refetchInterval: POLL_MS,
    staleTime: 1500,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const rig = data || null

  let label = 'GPU …'
  let tip = 'rig backend unreachable, or first poll in flight'
  let color = 'var(--ui-text-quaternary)'

  if (rig && typeof rig.ts === 'number') {
    if (kind === 'model') {
      const m = rig.model
      if (!m) {
        label = 'GPU idle'
        tip = 'No model loaded in GPU memory (neither nInfer nor basalt is serving)'
      } else if (m.multi) {
        label = m.engines.map(e => e.engine).join(' + ')
        tip = m.engines.map(e => `${e.engine}: ${e.model} @ ${e.url}`).join('\n')
      } else {
        const short = m.model.length > 26 ? '…' + m.model.slice(-25) : m.model
        label = `${m.engine} · ${short}`
        tip = [
          `${m.engine} — model resident in GPU memory`,
          m.model,
          m.max_context ? `${m.max_context} token context` : '',
          m.url,
        ]
          .filter(Boolean)
          .join('\n')
      }
      color = m ? 'inherit' : 'var(--ui-text-quaternary)'
    } else {
      const g = rig.gpus
      if (!g) {
        label = 'GPU —'
        tip = 'GPU utilisation unavailable (nvidia-smi on the PVE host unreachable)'
        color = 'var(--ui-text-quaternary)'
      } else {
        label = g.length === 1
          ? `GPU ${g[0].util} %`
          : `GPU ${g.map(x => x.util).join(' / ')} %`
        tip = g
          .map(x => `GPU${x.index}: ${x.util}% core · ${Math.round(x.mem_mib / 1024)} GiB VRAM used`)
          .join('\n')
        color = g.some(x => x.util >= 95) ? 'var(--ui-accent)' : 'inherit'
      }
    }
  }

  return jsx('span', {
    title: tip,
    style: { color },
    className:
      'flex items-center gap-1 px-1.5 text-[0.6875rem] leading-none whitespace-nowrap',
    children: label,
  })
}

export default {
  id: 'gpu-rig',
  name: 'GPU Rig',
  register(ctx) {
    ctx.registerMany([
      {
        id: 'model',
        area: STATUSBAR_AREAS.right,
        order: 120,
        render: () => jsx(Chip, { ctx, kind: 'model' }),
      },
      {
        id: 'util',
        area: STATUSBAR_AREAS.right,
        order: 125,
        render: () => jsx(Chip, { ctx, kind: 'util' }),
      },
    ])
  },
}
