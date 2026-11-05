import json, sqlite3, uuid
from pathlib import Path
from datetime import datetime, timezone
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware

DATA = Path('/home/user/workspace/website-review-data')
DATA.mkdir(exist_ok=True)
DB = DATA/'reviews.sqlite3'
app = FastAPI()
app.add_middleware(CORSMiddleware,allow_origins=['*'],allow_methods=['GET','PUT','POST','OPTIONS'],allow_headers=['*'])
def connect():
    c=sqlite3.connect(DB)
    c.row_factory=sqlite3.Row
    return c
with connect() as c:
    c.execute('CREATE TABLE IF NOT EXISTS drafts(visitor TEXT PRIMARY KEY, payload TEXT NOT NULL, updated TEXT NOT NULL)')
    c.execute('CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY, visitor TEXT NOT NULL, request_id TEXT NOT NULL, payload TEXT NOT NULL, created TEXT NOT NULL, UNIQUE(visitor,request_id))')
def visitor(r):
    v=r.headers.get('x-visitor-id')
    if not v and r.client and r.client.host in ('127.0.0.1','::1'):
        v=r.headers.get('x-local-review-browser')
    if not v: raise HTTPException(403,'Browser identity is missing. Download your backup and reopen the review link.')
    return v
async def body(r):
    raw=await r.body()
    if len(raw)>2_000_000: raise HTTPException(413,'Review is too large.')
    try:p=json.loads(raw)
    except:raise HTTPException(400,'Invalid review.')
    if not isinstance(p,dict):raise HTTPException(400,'Invalid review.')
    for key in ['notes','foldNotes','masterNotes','devSelections']:
        if not isinstance(p.get(key,{}),dict):raise HTTPException(400,'Invalid comment collection.')
    return p
def validate(p):
    selected=[v for key in ['foldNotes','masterNotes','devSelections'] for v in p.get(key,{}).values() if isinstance(v,dict) and v.get('selected') is True]
    if len(selected)>12:raise HTTPException(422,'Select no more than 12 sections across all three tabs.')
    try:orders=[int(v.get('order','')) for v in selected]
    except:raise HTTPException(422,'Every selected section needs an order from 1–12.')
    if any(n<1 or n>12 for n in orders) or len(set(orders))!=len(orders):
        raise HTTPException(422,'Use unique positions across the combined website, not separately per tab.')
@app.get('/health')
def health():return {'ok':True}
@app.get('/draft')
def get_draft(r:Request):
    with connect() as c:row=c.execute('SELECT payload,updated FROM drafts WHERE visitor=?',(visitor(r),)).fetchone()
    return {'draft':json.loads(row['payload']) if row else None,'updated':row['updated'] if row else None}
@app.put('/draft')
async def put_draft(r:Request):
    v=visitor(r);p=await body(r);now=datetime.now(timezone.utc).isoformat()
    with connect() as c:c.execute('INSERT INTO drafts(visitor,payload,updated) VALUES(?,?,?) ON CONFLICT(visitor) DO UPDATE SET payload=excluded.payload,updated=excluded.updated',(v,json.dumps(p),now))
    return {'saved':True,'updated':now}
@app.post('/reviews')
async def submit(r:Request):
    v=visitor(r);p=await body(r);validate(p)
    key=p.get('requestId')
    if not isinstance(key,str) or not 8<=len(key)<=100:raise HTTPException(400,'Missing submission ID.')
    now=datetime.now(timezone.utc).isoformat()
    with connect() as c:
        old=c.execute('SELECT id,created FROM reviews WHERE visitor=? AND request_id=?',(v,key)).fetchone()
        if old:return {'id':old['id'],'created':old['created'],'saved':True}
        rid=str(uuid.uuid4())
        c.execute('INSERT INTO reviews(id,visitor,request_id,payload,created) VALUES(?,?,?,?,?)',(rid,v,key,json.dumps(p),now))
        c.execute('INSERT INTO drafts(visitor,payload,updated) VALUES(?,?,?) ON CONFLICT(visitor) DO UPDATE SET payload=excluded.payload,updated=excluded.updated',(v,json.dumps(p),now))
    return {'id':rid,'created':now,'saved':True}
@app.get('/reviews/{rid}')
def read_review(rid:str,r:Request):
    with connect() as c:row=c.execute('SELECT payload,created FROM reviews WHERE id=? AND visitor=?',(rid,visitor(r))).fetchone()
    if not row:raise HTTPException(404,'Review not found for this browser.')
    return {'id':rid,'created':row['created'],'review':json.loads(row['payload'])}
