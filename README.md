# gpu-rig — desktop statusbar chips for the wolke rig

Desktop-app plugin (bottom ribbon, right cluster) showing:

1. **Model chip** — which model is currently resident in GPU memory
   (`nInfer · qwen3.8-27b-quasar`, `basalt · …`, or dim `GPU idle`).
   Ground truth: each engine's OpenAI-compatible `/v1/models`; an engine only
   answers while its weights are loaded. Hover: full model id, context size,
   endpoint.
2. **GPU util chip** — per-GPU core utilisation (`GPU 83 / 81 %`), hover shows
   each GPU's util + GiB VRAM used. Accent-coloured when a card hits ≥95 %.

## Data path

The chips poll the plugin's own gateway backend `GET /api/plugins/gpu-rig/rig`
every 4 s. That backend (`~/.hermes/plugins/gpu-rig/dashboard/plugin_api.py`
on the machine running the **ops** gateway, LXC 140) probes the two engines
over HTTP (`192.168.2.164:8000`, `192.168.2.163:8097`) and runs `nvidia-smi`
on the PVE host over ssh (alias `wolke`), with a 3 s TTL cache. The backend
is gated by `plugins.enabled` in the ops profile config and hot-mounts into
the running gateway without a restart.

If the window is connected to a gateway without that backend, the chips dim
to `GPU …` instead of showing stale data.

## Install (desktop app)

- One-click: open `hermes://plugin/install?repo=azido-azide-azide/gpu-rig&enable=1`
  in the desktop app, or Capabilities → Plugins → **Install from Git** →
  `azido-azide-azide/gpu-rig`.
- Manual: put `plugin.js` in `~/.hermes/desktop-plugins/gpu-rig/`
  (Windows: `%USERPROFILE%\.hermes\desktop-plugins\gpu-rig\`). The app
  hot-reloads on save; fallback is ⌘K → **Reload desktop plugins**.

Toggle: Capabilities → Plugins → **GPU Rig**. Remove: delete the folder (or
**Uninstall** in the Plugins page) — the backend half on the gateway is
separate and stays in place.

## Backend env overrides

`GPU_RIG_SSH_HOST` (default `wolke`), `GPU_RIG_NINFER_URL`, `GPU_RIG_BASALT_URL`
(set on the gateway process to change targets).
