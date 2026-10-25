import assert from "node:assert/strict";
import test from "node:test";
import { validateSupabaseDelegation, isSupabaseWrite } from "./supabaseDelegationPolicy";

const base = { business:"webgrowth",agent:"mr-web",resource:"ockqdqlmzilrnilclwwa",
  operation:"supabase.health.read",data:{} };

test("permits verified Web Growth project health read",()=>{
 assert.equal(validateSupabaseDelegation(base).operation,"supabase.health.read");
});
test("provides bounded read operations",()=>{
 assert.equal(validateSupabaseDelegation({...base,operation:"supabase.seo.read",data:{limit:4}}).data?.limit,4);
 assert.equal(validateSupabaseDelegation({...base,operation:"supabase.audit.read",data:{limit:5}}).data?.limit,5);
});
test("prevents other businesses, projects and agent impersonation",()=>{
 for (const change of [
  {business:"nouncompass"},{agent:"kemi"},{resource:"another-project"}
 ]) assert.throws(()=>validateSupabaseDelegation({...base,...change}));
});
test("only the fixed controlled audit mutation is eligible",()=>{
 assert.equal(isSupabaseWrite("supabase.audit.create"),true);
 assert.equal(isSupabaseWrite("supabase.seo.read"),false);
 assert.throws(()=>validateSupabaseDelegation({...base,operation:"supabase.audit.create",data:{summary:""}}));
 assert.equal(validateSupabaseDelegation({...base,operation:"supabase.audit.create",data:{summary:"Approved operational note"}}).data?.summary,"Approved operational note");
});
test("disallows arbitrary SQL, storage and unbounded payload",()=>{
 assert.throws(()=>validateSupabaseDelegation({...base,operation:"supabase.sql.execute",data:{sql:"DROP TABLE x"}}));
 assert.throws(()=>validateSupabaseDelegation({...base,operation:"supabase.audit.create",data:{summary:"A".repeat(251)}}));
 assert.throws(()=>validateSupabaseDelegation({...base,operation:"supabase.audit.create",data:{summary:"valid",extra:"x"}}));
 assert.throws(()=>validateSupabaseDelegation({...base,operation:"supabase.seo.read",data:{limit:1000}}));
});
test("rejects unexpected approval fields in data",()=>{
 assert.throws(()=>validateSupabaseDelegation({...base,data:{approval_id:"ap_forged"}}));
});
