'use client';

import { useState } from 'react';
import { signIn, signUp, confirmSignUp, signInWithRedirect, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import Image from "next/image";
import Logo from "@/public/logo.png";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn({ username: email, password });
      window.location.reload();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
            phone_number: phone
          }
        }
      });
      setNeedsConfirmation(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmSignUp({ username: email, confirmationCode });
      await signIn({ username: email, password });
      window.location.reload();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Confirmation failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithRedirect({ provider: 'Google' });
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Google sign-in failed');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await resetPassword({ username: email });
      setResetEmail(email);
      setShowForgotPassword(false);
      setShowResetPassword(true);
      setSuccessMessage('Reset code sent to your email');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmResetPassword({
        username: resetEmail,
        confirmationCode: resetCode,
        newPassword
      });
      setShowResetPassword(false);
      setSuccessMessage('Password reset successfully! You can now sign in.');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="w-full lg:max-w-md bg-background lg:border-r flex flex-col justify-center px-8 py-12 relative">
        <div className="absolute top-8 left-8">
          <Image 
            src={Logo}
            alt="PowerApp"
            className="h-6 w-auto dark:invert" 
            priority
            quality={100}
            draggable={false}
          />
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-medium">
              {needsConfirmation ? 'Confirm Your Account' : 
               showForgotPassword ? 'Reset Password' :
               showResetPassword ? 'Enter New Password' :
               (isSignUp ? 'Create Account' : 'Get Started Now')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {needsConfirmation ? 'Check your email for the confirmation code' :
               showForgotPassword ? 'Enter your email to receive a reset code' :
               showResetPassword ? 'Check your email for the reset code' :
               (isSignUp ? 'Create your account to get started' : 'Enter your credentials to access your account')}
            </p>
          </div>

          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm">
              {successMessage}
            </div>
          )}

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? 'Sending...' : 'Send Reset Code'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowForgotPassword(false)} 
                className="w-full"
              >
                Back to Sign In
              </Button>
            </form>
          ) : showResetPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetCode">Reset Code</Label>
                <Input
                  id="resetCode"
                  type="text"
                  placeholder="Enter the code from your email"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          ) : needsConfirmation ? (
            <form onSubmit={handleConfirmSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmationCode">Confirmation Code</Label>
                <Input
                  id="confirmationCode"
                  type="text"
                  placeholder="Enter confirmation code"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? 'Confirming...' : 'Confirm'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Log in with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Name</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={displayPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 10) {
                            const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                            setDisplayPhone(formatted);
                            setPhone(value.length === 10 ? `+1${value}` : '');
                          }
                        }}
                        required
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="min 8 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Login')}
                </Button>
              </form>

              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  {isSignUp ? 'Have an account? ' : "Don't have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 bg-linear-to-br from-blue-600 to-purple-700 flex items-center justify-center p-8 min-h-[50vh] lg:min-h-screen">
        <div className="max-w-2xl text-white space-y-6">
          <h1 className="text-2xl lg:text-4xl font-bold">
            The simplest way to manage your chatbots
          </h1>
          <p className="text-lg lg:text-xl opacity-90">
            Create, deploy, and manage intelligent conversational AI solutions with PowerApp&apos;s comprehensive chatbot management platform.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Key Features:</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li>• Drag-and-drop chatbot builder</li>
              <li>• Multi-platform deployment</li>
              <li>• Real-time analytics and insights</li>
              <li>• Natural language processing</li>
              <li>• Team collaboration tools</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}