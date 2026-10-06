require('./env');
// Encryption at rest (F4a): AES-256-GCM, file = "SFE1" | 12-byte nonce | ciphertext | 16-byte tag. Key from KATHAKAAR_KEY (64 hex chars or a passphrase) or KATHAKAAR_KEY_FILE.
const crypto=require('crypto'),fs=require('fs');
const load=raw=>{raw=String(raw||'').trim();if(!raw)return null;return /^[0-9a-f]{64}$/i.test(raw)?Buffer.from(raw,'hex'):crypto.createHash('sha256').update(raw).digest()};
const keyFrom=env=>load(env.KATHAKAAR_KEY||(env.KATHAKAAR_KEY_FILE&&fs.existsSync(env.KATHAKAAR_KEY_FILE)?fs.readFileSync(env.KATHAKAAR_KEY_FILE,'utf8'):''));
const MAGIC=Buffer.from('SFE1');
const enc=(buf,key)=>{const n=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,n),ct=Buffer.concat([c.update(buf),c.final()]);return Buffer.concat([MAGIC,n,ct,c.getAuthTag()])};
const isEnc=b=>b.length>=4+12+16&&b.subarray(0,4).equals(MAGIC);
const dec=(buf,key)=>{if(!isEnc(buf))return buf;if(!key)throw new Error('encrypted data but no KATHAKAAR_KEY set');const d=crypto.createDecipheriv('aes-256-gcm',key,buf.subarray(4,16));d.setAuthTag(buf.subarray(buf.length-16));return Buffer.concat([d.update(buf.subarray(16,buf.length-16)),d.final()])};
module.exports={keyFrom,enc,dec,isEnc,load};
