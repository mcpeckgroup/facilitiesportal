'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setMessage('');
    try {
      const redirect = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirect },
      });
      if (error) throw error;
      setStatus('sent');
      setMessage('Check your email for the magic link.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Failed to send sign-in link.');
    }
  }

  return (
    <div style={{maxWidth: 420, margin: '60px auto', padding: 24}}>
      <h1 style={{fontSize: 28, fontWeight: 700}}>Sign in</h1>
      <p style={{marginTop: 8, color: '#555'}}>We’ll email you a magic link.</p>

      <form onSubmit={sendMagicLink} style={{marginTop: 16, display: 'grid', gap: 12}}>
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          style={{padding: '10px 12px', border: '1px solid #ccc', borderRadius: 8}}
        />
        <button
          type="submit"
          disabled={status==='sending' || !email}
          style={{padding: '10px 12px', borderRadius: 8, border: '1px solid #111', background: '#111', color: '#fff'}}
        >
          {status==='sending' ? 'Sending…' : 'Send magic link'}
        </button>
      </form>

      {message && (
        <p style={{marginTop: 12, color: status==='error' ? '#b00020' : '#0a7b0a'}}>{message}</p>
      )}

      <hr style={{margin: '24px 0'}} />

      <button
        onClick={async ()=>{
          const { data } = await supabase.auth.getUser();
          if (data.user) router.push('/dashboard');
          else alert('No active session yet. Use the magic link sent to your email.');
        }}
        style={{background: 'transparent', border: '1px solid #ccc', padding: '8px 10px', borderRadius: 8}}
      >
        I already clicked the link
      </button>
    </div>
  );
}
