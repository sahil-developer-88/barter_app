import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import SignInForm from "@/components/auth/SignInForm";
import SignUpForm from "@/components/auth/SignUpForm";
import PasswordResetForm from "@/components/auth/PasswordResetForm";
import AuthAlerts from "@/components/auth/AuthAlerts";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

// Email validation schema
const emailSchema = z.string().email("Please enter a valid email address").min(1, "Email is required");

// Only clean Supabase auth state, not all localStorage
const cleanupSupabaseAuth = async () => {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    console.error('Error cleaning up auth:', error);
  }
};

// Fallback profile creation if trigger fails
const ensureProfileExists = async (userId: string, fullName: string, email: string) => {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingProfile) {
      // Profile doesn't exist, create it
      console.log('Profile not found, creating fallback profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          full_name: fullName,
          email: email,
          onboarding_completed: false
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        console.error('Fallback profile creation failed:', profileError);
        throw profileError;
      }
      
      console.log('Fallback profile created successfully');
    }
  } catch (error) {
    console.error('Error ensuring profile exists:', error);
    throw error;
  }
};

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate email format first
      const emailValidation = emailSchema.safeParse(email);
      if (!emailValidation.success) {
        setError(emailValidation.error.errors[0].message);
        setLoading(false);
        return;
      }

      // Validate email domain (basic check)
      const emailDomain = email.split('@')[1]?.toLowerCase();
      const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
      
      if (!emailDomain || (!commonDomains.includes(emailDomain) && !emailDomain.includes('.'))) {
        setError('Please use a valid email domain (e.g., gmail.com, your-company.com)');
        setLoading(false);
        return;
      }

      // Clean up any existing auth state
      await cleanupSupabaseAuth();

      console.log('Attempting signup with email:', email);

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (signupError) {
        console.error('Signup error:', signupError);
        
        // Handle specific error codes
        if (signupError.message.includes('email_address_invalid') || 
            signupError.message.includes('invalid') ||
            signupError.message.includes('not valid')) {
          setError('This email address is not valid or not allowed. Please use a valid email from a recognized domain (gmail.com, outlook.com, etc.)');
        } else if (signupError.message.includes('already registered') || 
                   signupError.message.includes('already exists')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (signupError.message.includes('password')) {
          setError('Password must be at least 6 characters long');
        } else {
          setError(`Sign up failed: ${signupError.message}`);
        }
        setLoading(false);
        return;
      }

      if (data.user && !data.session) {
        // Email confirmation is required
        setSuccess('✅ Account created successfully! Please check your email (including spam folder) and click the verification link to sign in. The link may take a few minutes to arrive.');
        toast({
          title: "✅ Account Created!",
          description: "Check your email for the verification link. If you don't see it, check your spam folder.",
          duration: 10000,
        });
      } else if (data.session && data.user) {
        // User is auto-logged in (email confirmation disabled)
        console.log('User signed up and logged in:', data.user.id);

        // Ensure profile exists (fallback if trigger failed)
        try {
          await ensureProfileExists(data.user.id, fullName, email);
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
          setError('Account created but profile setup failed. Please contact support.');
          setLoading(false);
          return;
        }

        // Log successful signup
        try {
          await supabase
            .from('audit_logs')
            .insert({
              user_id: data.user.id,
              action: 'user_signup',
              table_name: 'profiles',
              record_id: data.user.id
            });
        } catch (logError) {
          console.error('Audit log failed:', logError);
          // Don't fail signup if logging fails
        }
        
        toast({
          title: "Welcome to BarterEx!",
          description: "Let's set up your business profile.",
        });

        // Use React Router navigate
        navigate('/onboarding');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate email format first
      const emailValidation = emailSchema.safeParse(email);
      if (!emailValidation.success) {
        setError(emailValidation.error.errors[0].message);
        setLoading(false);
        return;
      }

      // Clean up any existing auth state
      await cleanupSupabaseAuth();

      console.log('Attempting to sign in with:', email);
      
      const { data, error: signinError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signinError) {
        console.error('Sign in error:', signinError);
        
        // Handle specific error codes
        if (signinError.message.includes('Email not confirmed')) {
          setError('Please check your email and click the verification link before signing in.');
        } else if (signinError.message.includes('Invalid login credentials') || 
                   signinError.message.includes('invalid')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (signinError.message.includes('Email link is invalid')) {
          setError('This sign-in link has expired. Please request a new one.');
        } else {
          setError(`Sign in failed: ${signinError.message}`);
        }
        setLoading(false);
        return;
      }

      if (data.session && data.user) {
        console.log('Sign in successful:', data.user.id);
        
        // Log successful signin
        try {
          await supabase
            .from('audit_logs')
            .insert({
              user_id: data.user.id,
              action: 'user_signin',
              table_name: 'profiles',
              record_id: data.user.id
            });
        } catch (logError) {
          console.error('Audit log failed:', logError);
          // Don't fail signin if logging fails
        }

        // Check onboarding status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile check error:', profileError);
          setError('Failed to load profile. Please try again.');
          setLoading(false);
          return;
        }

        if (!profile) {
          console.log('No profile found, creating one...');
          // Profile doesn't exist, try to create it
          try {
            await ensureProfileExists(data.user.id, data.user.user_metadata?.full_name || '', data.user.email || '');
            navigate('/onboarding');
          } catch (profileCreateError) {
            setError('Failed to create profile. Please contact support.');
            setLoading(false);
          }
          return;
        }

        toast({
          title: "Welcome back!",
          description: "Redirecting to your dashboard...",
        });

        // Use React Router navigate
        if (profile.onboarding_completed) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate email format first
      const emailValidation = emailSchema.safeParse(email);
      if (!emailValidation.success) {
        setError(emailValidation.error.errors[0].message);
        setLoading(false);
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      if (resetError) {
        console.error('Password reset error:', resetError);
        setError(`Failed to send reset email: ${resetError.message}`);
        setLoading(false);
        return;
      }

      setResetEmailSent(true);
      setSuccess('Password reset email sent! Check your inbox.');
      
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Handshake className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">BarterEx</h1>
          </div>
          <CardTitle>Welcome to Business Barter</CardTitle>
          <CardDescription>Trade services with other businesses using our credit system</CardDescription>
        </CardHeader>

        <CardContent>
          <AuthAlerts 
            error={error}
            success={success}
          />

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="reset">Reset</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              <SignInForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loading={loading}
                onSubmit={handleSignIn}
              />
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <SignUpForm
                fullName={fullName}
                setFullName={setFullName}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loading={loading}
                onSubmit={handleSignUp}
              />
            </TabsContent>

            <TabsContent value="reset" className="space-y-4 mt-4">
              <PasswordResetForm
                email={email}
                setEmail={setEmail}
                loading={loading}
                resetEmailSent={resetEmailSent}
                setResetEmailSent={setResetEmailSent}
                onSubmit={handleResetPassword}
              />
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate('/')} className="text-sm">
              ← Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
