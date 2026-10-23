import json, os, random, secrets, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOMS = {}
LOCK = threading.Lock()

def action(data):
    kind = data.get('action')
    if kind not in ('create', 'join', 'state', 'start', 'play', 'draw', 'pass', 'restart'):
        raise ValueError('Aksi tidak dikenal.')
    code = str(data.get('code', '')).strip().upper()
    token = data.get('token')
    if kind == 'create':
        code = secrets.token_hex(3).upper()
        while code in ROOMS:
            code = secrets.token_hex(3).upper()
        ROOMS[code] = dict(players=[], board=[], stock=[], turn=0, started=False, winners=None, passes=0, updated=time.time())
        kind = 'join'
    if code not in ROOMS:
        raise ValueError('Room tidak ditemukan. Buat room baru atau periksa kodenya.')
    room = ROOMS[code]
    if kind == 'join':
        if room['started'] or len(room['players']) >= 4:
            raise ValueError('Room sudah bermain atau penuh.')
        name = str(data.get('name', '')).strip()[:24]
        if not name:
            raise ValueError('Isi nama pemain dahulu.')
        token = secrets.token_urlsafe(24)
        room['players'].append(dict(name=name, token=token, hand=[]))
    player = next((p for p in room['players'] if p['token'] == token), None)
    if player is None:
        raise ValueError('Sesi tidak valid. Silakan bergabung kembali.')
    me = room['players'].index(player)
    if kind in ('start', 'restart'):
        if me != 0 or len(room['players']) < 2:
            raise ValueError('Hanya host yang dapat memulai, dengan minimal 2 pemain.')
        if room['started'] and room['winners'] is None:
            raise ValueError('Permainan masih berjalan.')
        deck = [[a, b] for a in range(7) for b in range(a, 7)]
        random.shuffle(deck)
        for p in room['players']:
            p['hand'] = [deck.pop() for _ in range(7)]
        room.update(board=[], stock=deck, turn=0, started=True, winners=None, passes=0)
    if kind in ('play', 'draw', 'pass'):
        if not room['started'] or room['winners'] is not None or room['turn'] != me:
            raise ValueError('Tunggu giliran Anda.')
        board = room['board']
        can_play = lambda t: not board or board[0][0] in t or board[-1][1] in t
        if kind == 'play':
            index = data.get('tile')
            if type(index) is not int or not 0 <= index < len(player['hand']):
                raise ValueError('Kartu tidak valid.')
            side = data.get('side', 'right')
            if side not in ('left', 'right'):
                raise ValueError('Sisi tidak valid.')
            tile = player['hand'][index][:]
            if board:
                end = board[0][0] if side == 'left' else board[-1][1]
                if end not in tile:
                    raise ValueError('Angka kartu tidak cocok dengan ujung meja.')
                if (side == 'left' and tile[1] != end) or (side == 'right' and tile[0] != end):
                    tile.reverse()
            player['hand'].pop(index)
            if side == 'left':
                board.insert(0, tile)
            else:
                board.append(tile)
            room['passes'] = 0
            if not player['hand']:
                room['winners'] = [me]
        else:
            if any(can_play(t) for t in player['hand']):
                raise ValueError('Masih ada kartu yang bisa dimainkan.')
            if kind == 'draw':
                if not room['stock']:
                    raise ValueError('Stok habis. Lewati giliran.')
                player['hand'].append(room['stock'].pop())
            else:
                if room['stock']:
                    raise ValueError('Ambil kartu dari stok dahulu.')
                room['passes'] += 1
                if room['passes'] >= len(room['players']):
                    scores = [sum(map(sum, p['hand'])) for p in room['players']]
                    room['winners'] = [i for i, score in enumerate(scores) if score == min(scores)]
        if kind != 'draw':
            room['turn'] = (me + 1) % len(room['players'])
    room['updated'] = time.time()
    return dict(code=code, token=token, me=me, hand=player['hand'], players=[dict(name=p['name'], count=len(p['hand'])) for p in room['players']], stock=len(room['stock']), **{key: room[key] for key in ('board', 'turn', 'started', 'winners')})

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.reply(200, Path(__file__).with_name('index.html').read_bytes(), 'text/html; charset=utf-8')
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 8192:
                raise ValueError('Permintaan tidak valid.')
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError('Permintaan tidak valid.')
            with LOCK:
                for code in list(ROOMS):
                    if time.time() - ROOMS[code]['updated'] > 86400:
                        del ROOMS[code]
                result = action(data)
            self.reply(200, json.dumps(result).encode())
        except (ValueError, TypeError, KeyError) as error:
            self.reply(400, json.dumps({'error': str(error)}).encode())
    def reply(self, status, body, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8787'))
    print(f'Domino siap: http://localhost:{port}', flush=True)
    ThreadingHTTPServer(('0.0.0.0', port), Handler).serve_forever()
