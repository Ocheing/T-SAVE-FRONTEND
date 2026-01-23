import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Database, Shield, RefreshCw, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSetup() {
    const { user, isInitialized } = useAuth();
    const [checkStatus, setCheckStatus] = useState<{
        tableExists: boolean | null;
        userIsAdmin: boolean | null;
        error: string | null;
    }>({
        tableExists: null,
        userIsAdmin: null,
        error: null
    });
    const [isLoading, setIsLoading] = useState(false);

    const checkSetup = async () => {
        setIsLoading(true);
        setCheckStatus({ tableExists: null, userIsAdmin: null, error: null });

        try {
            // Check 1: Does admin_users table exist?
            // "maybeSingle" checks connection and structure essentially
            const { error: tableError } = await supabase
                .from('admin_users')
                .select('count')
                .limit(1)
                .maybeSingle();

            if (tableError && tableError.code === '42P01') {
                setCheckStatus(prev => ({ ...prev, tableExists: false, error: 'Table not found' }));
                setIsLoading(false);
                return;
            }

            // Check 2: Is current user in it?
            if (user) {
                const { data: adminData, error: adminError } = await supabase
                    .from('admin_users')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();

                if (adminError) {
                    console.error('Error checking admin status:', adminError);
                }

                setCheckStatus({
                    tableExists: true,
                    userIsAdmin: !!adminData,
                    error: null
                });
            } else {
                setCheckStatus({
                    tableExists: true,
                    userIsAdmin: false,
                    error: 'User not logged in'
                });
            }

        } catch (err: unknown) {
            console.error('Setup check failed:', err);
            const errMessage = err instanceof Error ? err.message : 'Unknown error';
            setCheckStatus(prev => ({ ...prev, error: errMessage }));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isInitialized) {
            checkSetup();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInitialized, user]);

    const copySql = () => {
        const sql = `
-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own role"
  ON public.admin_users FOR SELECT USING (auth.uid() = id);

-- REPLACE WITH YOUR USER ID
INSERT INTO public.admin_users (id, role)
VALUES ('${user?.id || 'YOUR_USER_ID_HERE'}', 'super_admin')
ON CONFLICT (id) DO NOTHING;
`;
        navigator.clipboard.writeText(sql);
        toast.success('SQL copied to clipboard!');
    };

    if (!isInitialized) return <div className="p-10">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex items-center justify-center">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Admin Setup Diagnostics</CardTitle>
                            <CardDescription>Troubleshoot your admin configuration</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* User Info */}
                    <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Current User ID</p>
                            <p className="font-mono text-sm">{user?.id || 'Not logged in'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="font-medium">{user?.email || '-'}</p>
                        </div>
                    </div>

                    {/* Status Checks */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                                <Database className="w-5 h-5 text-muted-foreground" />
                                <span className="font-medium">Database Table (admin_users)</span>
                            </div>
                            {checkStatus.tableExists === null ? (
                                <span className="text-muted-foreground animate-pulse">Checking...</span>
                            ) : checkStatus.tableExists ? (
                                <span className="flex items-center gap-1 text-green-600 font-bold">
                                    <CheckCircle className="w-4 h-4" /> Exists
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-red-500 font-bold">
                                    <AlertCircle className="w-4 h-4" /> Missing
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-muted-foreground" />
                                <span className="font-medium">Admin Privileges</span>
                            </div>
                            {checkStatus.userIsAdmin === null ? (
                                <span className="text-muted-foreground animate-pulse">Checking...</span>
                            ) : checkStatus.userIsAdmin ? (
                                <span className="flex items-center gap-1 text-green-600 font-bold">
                                    <CheckCircle className="w-4 h-4" /> Active
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-amber-500 font-bold">
                                    <AlertCircle className="w-4 h-4" /> Not Assigned
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Fix Actions */}
                    {(!checkStatus.tableExists || !checkStatus.userIsAdmin) && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Action Required
                            </h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                                {!checkStatus.tableExists
                                    ? "The admin database table is missing. Run the SQL script below in Supabase."
                                    : "You are not listed as an admin. Run the SQL script below to add yourself."}
                            </p>

                            <Button variant="outline" size="sm" onClick={copySql} className="w-full gap-2 bg-white dark:bg-black">
                                <Copy className="w-4 h-4" />
                                Copy SQL Setup Script
                            </Button>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button onClick={checkSetup} disabled={isLoading} variant="secondary">
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Run Diagnostics Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
