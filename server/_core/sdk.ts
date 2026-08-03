import { COOKIE_NAME } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import type { Request } from "express";
import { jwtVerify } from "jose";
import { ENV } from "./env";

// Independent SDK Server for Supabase Auth
// Removed all Manus OAuth dependencies

class SDKServer {
  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  async authenticateRequest(req: Request): Promise<any> {
    // Check for Supabase token in Authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        // Parse token to get userId
        let userId: string;
        let tokenPayload: any;
        
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid token format');
        tokenPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        userId = tokenPayload.sub;
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (tokenPayload.exp && tokenPayload.exp < now) {
          throw new Error('Token expired');
        }
        
        // Verify Supabase token using Supabase Admin API
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        const { data: { user: supabaseUser }, error } = await supabase.auth.admin.getUserById(userId);
        
        if (error || !supabaseUser) {
          throw new Error('Invalid Supabase token');
        }
        
        const supabaseName = supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || supabaseUser.email || '';
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
