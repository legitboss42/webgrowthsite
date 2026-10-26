import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {createHash} from 'node:crypto';
const source=readFileSync(new URL('./socialIamDelegation.ts',import.meta.url),'utf8')
 .replace('import "server-only";','')
 .replace(/import \{ createSchedulerSupabaseClient \} from [^;]+;/,'const createSchedulerSupabaseClient=()=>{throw new Error("unexpected website approval database call")};');
const m=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source,{mode:'transform'})).toString('base64'));
const base=()=>({business:'webgrowth',agent:'mr-web',operation:'whatsapp.reply',resource:'664f48bd-168f-416a-b731-5ad93b34093f',data:{message:'isolated fixture'},approvalId:'ap_isolated_fixture_123',telegramApproval:{source:'telegram',expiresAt:new Date(Date.now()+60000).toISOString()}});
function evidence(action){const body=JSON.stringify(action),nonce='a'.repeat(32);return {body,nonce,headers:{authorization:'AWS4-HMAC-SHA256 SignedHeaders=host;x-amz-date;x-mrweb-audience;x-mrweb-context, Signature=fixture','x-amz-date':new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z'),'content-type':'application/x-www-form-urlencoded','x-mrweb-audience':'webgrowth.info/openclaw-social-v1','x-mrweb-context':createHash('sha256').update(nonce+'\n'+body).digest('hex')}};}
const transport=async()=>new Response('<Arn>arn:aws:sts::849662766503:assumed-role/mr-web-ai-ssm/fixture</Arn>');
test('signed exact Telegram receipt satisfies provider approval without website login',async()=>{const a=await m.verifyDelegatedOperation(evidence(base()),{transport,reserve:async()=>true});m.validateProviderApproval(a);await m.consumeSiteOwnerApproval(a);});
test('unverified action object cannot claim Telegram approval',async()=>{await assert.rejects(m.consumeSiteOwnerApproval(base()),/OWNER_APPROVAL_NOT_VERIFIED/);});
test('expired Telegram receipt fails closed',async()=>{const a=base();a.telegramApproval.expiresAt=new Date(0).toISOString();await assert.rejects(m.verifyDelegatedOperation(evidence(a),{transport,reserve:async()=>true}),/TELEGRAM_APPROVAL_INVALID/);});
test('forged STS proof cannot authorize Telegram receipt',async()=>{await assert.rejects(m.verifyDelegatedOperation(evidence(base()),{transport:async()=>new Response('',{status:403}),reserve:async()=>true}),/STS_ATTESTATION_REJECTED/);});
test('duplicate approval reservation denies replay',async()=>{await assert.rejects(m.verifyDelegatedOperation(evidence(base()),{transport,reserve:async()=>false}),/DUPLICATE_OR_UNAVAILABLE_APPROVAL/);});
test('Telegram receipt without exact approval ID is denied',async()=>{const a=base();delete a.approvalId;await assert.rejects(m.verifyDelegatedOperation(evidence(a),{transport,reserve:async()=>true}),/TELEGRAM_APPROVAL_INVALID/);});
test('wrong agent retains provider role denial',async()=>{const a=base();a.agent='zara';const verified=await m.verifyDelegatedOperation(evidence(a),{transport,reserve:async()=>true});assert.throws(()=>m.validateProviderApproval(verified),/WHATSAPP_AGENT_ROLE_DENIED/);});
