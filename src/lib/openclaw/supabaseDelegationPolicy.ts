/** Fixed business/project read and controlled-write surface for Mr Web.
 * No SQL, dynamic table names, cross-business account selectors or secrets.
 */
export const WEBGROWTH_SUPABASE_PROJECT = "ockqdqlmzilrnilclwwa" as const;
const READS = new Set(["supabase.health.read","supabase.seo.read","supabase.audit.read"]);
const WRITES = new Set(["supabase.audit.create"]);
type Delegation = {
  business: string;
  agent: string;
  resource: string;
  operation: string;
  data?: Record<string,unknown>;
  approvalId?: string;
};
export class SupabaseDelegationDenied extends Error {
  constructor(public readonly code:string) { super(code); }
}
export function isSupabaseWrite(operation:string):boolean { return WRITES.has(operation); }
export function validateSupabaseDelegation(action:Delegation):Delegation {
  if (!action || action.business!=="webgrowth" || action.agent!=="mr-web" ||
      action.resource!==WEBGROWTH_SUPABASE_PROJECT)
    throw new SupabaseDelegationDenied("BUSINESS_AGENT_OR_PROJECT_DENIED");
  if (!READS.has(action.operation) && !WRITES.has(action.operation))
    throw new SupabaseDelegationDenied("UNSUPPORTED_SUPABASE_OPERATION");
  if (Object.keys(action).some(k=>!["business","agent","resource","operation","data","approvalId"].includes(k)))
    throw new SupabaseDelegationDenied("UNEXPECTED_INPUT");
  if (action.data!==undefined && (!action.data || typeof action.data!=="object" || Array.isArray(action.data)))
    throw new SupabaseDelegationDenied("INVALID_DATA");
  const data=action.data||{};
  if (action.operation==="supabase.health.read") {
    if (Object.keys(data).length) throw new SupabaseDelegationDenied("INVALID_READ_INPUT");
  } else if (action.operation==="supabase.seo.read" || action.operation==="supabase.audit.read") {
    if (Object.keys(data).some(k=>k!=="limit") || (data.limit!==undefined &&
        (!Number.isInteger(data.limit) || Number(data.limit)<1 || Number(data.limit)>10)))
      throw new SupabaseDelegationDenied("INVALID_READ_LIMIT");
  } else if (action.operation==="supabase.audit.create") {
    const summary=data.summary;
    if (Object.keys(data).some(k=>k!=="summary") || typeof summary!=="string" ||
      !summary.trim() || summary.length>250 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(summary))
      throw new SupabaseDelegationDenied("INVALID_AUDIT_NOTE");
  }
  if (action.approvalId!==undefined && (typeof action.approvalId!=="string" ||
     !/^ap_[a-zA-Z0-9_-]{8,100}$/.test(action.approvalId)))
    throw new SupabaseDelegationDenied("INVALID_APPROVAL");
  return action;
}
