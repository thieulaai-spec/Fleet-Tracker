import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';

@Controller('amm')
export class AmmController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly trackingGateway: TrackingGateway,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  page(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; connect-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
    );
    res.send(this.renderPage());
  }

  @Get('status/:deviceId')
  async status(
    @Param('deviceId') deviceId: string,
    @Query('key') key?: string,
    @Headers('x-amm-key') headerKey?: string,
  ) {
    this.assertKey(headerKey || key);
    return this.trackingService.getAmmStatus(deviceId);
  }

  @Post('command')
  async command(
    @Body()
    body: {
      key?: string;
      deviceId?: string;
      command?: string;
      enabled?: boolean;
    },
    @Headers('x-amm-key') headerKey?: string,
  ) {
    this.assertKey(headerKey || body?.key);

    const deviceId = (body?.deviceId || 'device_001').trim();
    const command = String(body?.command || '').trim().toLowerCase();
    const enabled =
      typeof body?.enabled === 'boolean'
        ? body.enabled
        : command === '1' ||
          command === 'on' ||
          command === 'amm 1' ||
          command === 'amm on';

    const disabled =
      command === '2' ||
      command === 'off' ||
      command === 'amm 2' ||
      command === 'amm off';

    if (!enabled && !disabled) {
      return {
        status: 'error',
        message: 'Use amm 1 / amm on / 1 / on or amm 2 / amm off / 2 / off',
      };
    }

    const result = await this.trackingService.setAmmEnabled(deviceId, enabled);
    if (result.driverId) {
      this.trackingGateway.server
        .to(`driver:${result.driverId}`)
        .emit('phone-fallback:state', {
          deviceId,
          enabled,
          updatedAt: result.updatedAt,
        });
    }

    return {
      status: 'ok',
      ...result,
    };
  }

  private assertKey(provided?: string) {
    const expected =
      this.configService.get<string>('AMM_CONTROL_KEY') ||
      this.configService.get<string>('DEVICE_API_KEY');

    if (!expected || provided !== expected) {
      throw new UnauthorizedException('Invalid AMM key');
    }
  }

  private renderPage() {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AMM Control</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, sans-serif; }
    body { margin: 0; background: #0b1020; color: #e5e7eb; }
    main { max-width: 860px; margin: 0 auto; padding: 18px; }
    h1 { margin: 8px 0 4px; font-size: 28px; }
    .muted { color: #94a3b8; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; margin-top: 16px; }
    .card { background: #111827; border: 1px solid #263244; border-radius: 8px; padding: 14px; }
    label { display: block; color: #94a3b8; font-size: 12px; margin-bottom: 6px; }
    input { width: 100%; box-sizing: border-box; background: #020617; color: #e5e7eb; border: 1px solid #334155; border-radius: 6px; padding: 11px; font-size: 16px; }
    button { width: 100%; border: 0; border-radius: 6px; padding: 13px; margin-top: 10px; color: white; font-weight: 800; font-size: 16px; }
    .on { background: #16a34a; }
    .off { background: #dc2626; }
    .refresh { background: #2563eb; }
    pre { white-space: pre-wrap; word-break: break-word; background: #020617; border-radius: 6px; padding: 12px; min-height: 240px; }
    .pill { display: inline-block; padding: 4px 8px; border-radius: 999px; background: #334155; color: #cbd5e1; font-size: 12px; margin-left: 8px; }
  </style>
</head>
<body>
  <main>
    <h1>AMM Control <span id="state" class="pill">unknown</span></h1>
    <div class="muted">Private rescue panel. UI chinh va Serial khong hien che do nay.</div>

    <div class="grid">
      <div class="card">
        <label>AMM key</label>
        <input id="key" type="password" placeholder="AMM_CONTROL_KEY or DEVICE_API_KEY" />
        <label style="margin-top:12px">Device ID</label>
        <input id="deviceId" value="device_001" />
        <button class="on" onclick="sendCommand('amm 1')">AMM 1 / ON</button>
        <button class="off" onclick="sendCommand('amm 2')">AMM 2 / OFF</button>
        <button class="refresh" onclick="loadStatus()">Refresh status</button>
      </div>
      <div class="card">
        <label>Command</label>
        <input id="command" placeholder="amm 1 or amm 2" onkeydown="if(event.key==='Enter')sendCommand(this.value)" />
        <button class="refresh" onclick="sendCommand(document.getElementById('command').value)">Run command</button>
        <div class="muted" style="margin-top:14px">
          AMM ON forces the next valid phone GPS point to rescue immediately, then backend throttles updates like IoT GPS.
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <label>Status</label>
      <pre id="out">Enter key, then press Refresh.</pre>
    </div>
  </main>

  <script>
    const keyInput = document.getElementById('key');
    const deviceInput = document.getElementById('deviceId');
    keyInput.value = localStorage.getItem('amm_key') || '';
    deviceInput.value = localStorage.getItem('amm_device') || 'device_001';

    function saveInputs() {
      localStorage.setItem('amm_key', keyInput.value);
      localStorage.setItem('amm_device', deviceInput.value);
    }

    function show(data) {
      document.getElementById('out').textContent = JSON.stringify(data, null, 2);
      if (data && typeof data.enabled === 'boolean') {
        document.getElementById('state').textContent = data.enabled ? 'ON' : 'OFF';
      }
    }

    async function loadStatus() {
      saveInputs();
      const deviceId = encodeURIComponent(deviceInput.value.trim() || 'device_001');
      const key = encodeURIComponent(keyInput.value);
      try {
        const res = await fetch('/api/amm/status/' + deviceId + '?key=' + key);
        show(await res.json());
      } catch (error) {
        show({ error: String(error) });
      }
    }

    async function sendCommand(command) {
      saveInputs();
      try {
        const res = await fetch('/api/amm/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-amm-key': keyInput.value },
          body: JSON.stringify({
            key: keyInput.value,
            deviceId: deviceInput.value.trim() || 'device_001',
            command
          })
        });
        const data = await res.json();
        show(data);
        setTimeout(loadStatus, 300);
      } catch (error) {
        show({ error: String(error) });
      }
    }

    if (keyInput.value) loadStatus();
  </script>
</body>
</html>`;
  }
}
