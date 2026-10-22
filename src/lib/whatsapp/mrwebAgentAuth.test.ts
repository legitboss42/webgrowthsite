import test from "node:test";
import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {requireAgentInboxQuery,verifyMrWebAgentSignature} from "./mrwebAgentAuth";

const workspaceId="123e4567-e89b-42d3-a456-426614174000";
const conversationId="123e4567-e89b-42d3-a456-426614174001";
const key="s".repeat(64);
test("signed exact workspace read request is valid",()=>{
 const body=JSON.stringify({operation:"messages.list",business:"webgrowth",workspaceId,conversationId,limit:5});
 const timestamp="1770000000",nonce="a".repeat(32);
 const signature="sha256="+createHmac("sha256",key).update("v1\n"+timestamp+"\n"+nonce+"\n"+body).digest("hex");
 assert.equal(verifyMrWebAgentSignature({body,timestamp,nonce,signature,secret:key,nowSeconds:1770000000}),true);
 assert.equal(requireAgentInboxQuery(JSON.parse(body),workspaceId).operation,"messages.list");
 assert.equal(verifyMrWebAgentSignature({body:body+" ",timestamp,nonce,signature,secret:key,nowSeconds:1770000000}),false);
 assert.equal(verifyMrWebAgentSignature({body,timestamp,nonce,signature,secret:key,nowSeconds:1770000200}),false);
});
test("business crossing, customer workspace and agent permission claims denied",()=>{
 for(const value of [
   {operation:"conversations.list",business:"nouncompass",workspaceId},
   {operation:"conversations.list",business:"webgrowth",workspaceId:"123e4567-e89b-42d3-a456-426614174099"},
   {operation:"conversations.list",business:"webgrowth",workspaceId,owner:true},
   {operation:"messages.send",business:"webgrowth",workspaceId},
   {operation:"messages.list",business:"webgrowth",workspaceId,conversationId:"../../private"},
   {operation:"messages.list",business:"webgrowth",workspaceId,conversationId,limit:10000}
 ])assert.throws(()=>requireAgentInboxQuery(value,workspaceId));
});
test("no secret, invalid HMAC and malformed nonce fail authentication",()=>{
 const body="{}";
 assert.equal(verifyMrWebAgentSignature({body,timestamp:"1770000000",nonce:"a".repeat(32),signature:"sha256="+("a".repeat(64)),secret:undefined,nowSeconds:1770000000}),false);
 assert.equal(verifyMrWebAgentSignature({body,timestamp:"1770000000",nonce:"z".repeat(32),signature:"sha256="+("a".repeat(64)),secret:key,nowSeconds:1770000000}),false);
});
