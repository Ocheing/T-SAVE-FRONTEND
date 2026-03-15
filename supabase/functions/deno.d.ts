// Type declarations for Supabase Edge Functions (Deno runtime)
// These suppress VS Code TypeScript errors for Deno-specific APIs

declare namespace Deno {
    function serve(handler: (req: Request) => Response | Promise<Response>): void;

    interface Env {
        get(key: string): string | undefined;
    }

    const env: Env;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
    export function createClient(
        url: string,
        key: string,
        options?: Record<string, unknown>
    ): import('@supabase/supabase-js').SupabaseClient;
}

declare module 'https://deno.land/std@0.177.0/node/crypto.ts' {
    export function createHmac(algorithm: string, key: string): {
        update(data: string): {
            digest(encoding: string): string;
        };
    };
}
