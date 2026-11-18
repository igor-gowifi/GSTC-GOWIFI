import { ForbiddenError } from "@shared/_core/errors";
import type { Request } from "express";
import { createSupabaseServerClient, getSupabaseUserName } from "../supabaseUsers";

// Independent SDK Server for Supabase Auth
// Removed all Manus OAuth dependencies

class SDKServer {
  async authenticateRequest(req: Request): Promise<any> {
    // Check for Supabase token in Authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const supabase = createSupabaseServerClient();
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
        
        if (error || !supabaseUser) {
          throw new Error('Invalid Supabase token');
        }
        
        const supabaseName = getSupabaseUserName(supabaseUser);
        const supabaseRole = (supabaseUser.user_metadata?.role as string) || 'analista';
        
        return {
          openId: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseName,
          role: supabaseRole,
          createdAt: new Date(supabaseUser.created_at),
          updatedAt: new Date(supabaseUser.updated_at),
          lastSignedIn: new Date(),
        };
      } catch (error) {
        console.error('[Auth] Verification failed:', error instanceof Error ? error.message : error);
        throw ForbiddenError("Invalid session - Supabase token verification failed");
      }
    }

    throw ForbiddenError("Missing Authorization header");
  }
}

export const sdk = new SDKServer();
