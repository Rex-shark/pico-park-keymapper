// WebSocket server for pico-park-keymapper (目前僅 log 鍵盤指令，未實際觸發鍵盤)
import { WebSocketServer } from 'ws';

const PORT = 5174; // separate from Vite dev server

/**
 * rooms: {
 *   [roomId: string]: {
 *     host: WebSocket | null,
 *     clients: Map<userId, WebSocket>
 *   }
 * }
 */
const rooms = new Map();

function log(...args) {
  console.log('[server]', ...args);
}

const wss = new WebSocketServer({ port: PORT, path: '/socket' });

wss.on('connection', (ws, request) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const roomId = url.searchParams.get('roomId');
  const userId = url.searchParams.get('userId');
  const role = url.searchParams.get('role') || 'user';

  if (!roomId) {
    ws.close(1008, 'roomId required');
    return;
  }

  if (role === 'host') {
    let room = rooms.get(roomId);
    if (!room) {
      room = { host: ws, clients: new Map() };
      rooms.set(roomId, room);
      log(`Created room ${roomId}`);
    } else {
      room.host = ws;
      log(`Host reconnected to room ${roomId}`);
    }

    ws.send(JSON.stringify({ type: 'system', message: `Host joined room ${roomId}` }));

    ws.on('message', raw => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'chat') {
          // just echo in host UI
          ws.send(JSON.stringify({ type: 'chat', from: 'host', text: msg.text }));
        }
      } catch (e) {
        log('Invalid message from host', e);
      }
    });

    ws.on('close', () => {
      const room = rooms.get(roomId);
      if (room && room.host === ws) {
        room.host = null;
        log(`Host left room ${roomId}`);
      }
    });
  } else {
    // user connection
    if (!userId) {
      ws.close(1008, 'userId required for user role');
      return;
    }

    let room = rooms.get(roomId);
    if (!room) {
      // no host yet, create room but without host
      room = { host: null, clients: new Map() };
      rooms.set(roomId, room);
      log(`Created room ${roomId} for first user ${userId}`);
    }

    room.clients.set(userId, ws);

    const host = room.host;
    if (host && host.readyState === ws.OPEN) {
      host.send(JSON.stringify({ type: 'system', message: `玩家${userId}已連線` }));
    }

    ws.on('message', raw => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'input') {
          const { command } = msg;
          const mapped = mapCommandToKey(userId, command);

          // 目前僅 log，不觸發實際鍵盤事件
          log(`玩家${userId} command=${command} mappedKey=${mapped || '無對應'}`);

          if (host && host.readyState === ws.OPEN) {
            host.send(
              JSON.stringify({
                type: 'system',
                message: `玩家${userId}移動手把: ${command} 、轉換後: ${mapped || '無對應'}`,
              }),
            );
          }
        }
      } catch (e) {
        log('Invalid message from user', e);
      }
    });

    ws.on('close', () => {
      const room = rooms.get(roomId);
      if (room) {
        room.clients.delete(userId);
        log(`User ${userId} left room ${roomId}`);
      }
    });
  }
});

function mapCommandToKey(userId, command) {
  const mappings = {
    '1': {
      left: 'Left',
      right: 'Right',
      up: 'Up',
      down: 'Down',
      A: 'Z',
      B: 'X',
    },
    '2': {
      left: 'A',
      right: 'D',
      up: 'W',
      down: 'S',
      A: 'J',
      B: 'K',
    },
  };
  const table = mappings[String(userId)];
  return table ? table[command] : undefined;
}

log(`WebSocket server listening on ws://localhost:${PORT}/socket`);
