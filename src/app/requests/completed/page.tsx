'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface WorkOrder {
  id: string;
  title: string;
  business: string | null;
  priority: string | null;
  created_at: string;
}

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      const { data,
