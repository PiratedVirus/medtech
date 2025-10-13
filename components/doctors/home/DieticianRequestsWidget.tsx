"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import { Clock, CheckCircle2, User, Calendar, ArrowRight, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface RequestItem {
  id: number;
  patientId: number;
  dieticianId: number;
  complaint: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  createdAt: string;
  patient?: { id: number; name: string };
}

export default function DieticianRequestsWidget() {
  const { profile } = useDecryptedProfile();
  const dieticianId = profile?.id;
  const [pending, setPending] = useState<RequestItem[]>([]);
  const [completed, setCompleted] = useState<RequestItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!dieticianId) return;
    async function load() {
      try {
        const res = await axios.get(`/api/doctor/diet-requests?dieticianId=${dieticianId}`);
        const list: RequestItem[] = res.data?.requests || [];
        setPending(list.filter(r => r.status === "PENDING"));
        setCompleted(list.filter(r => r.status !== "PENDING"));
      } catch {}
    }
    load();
  }, [dieticianId]);

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 shadow-lg overflow-hidden">
        <div className="relative p-6 bg-gradient-to-tr from-[#1e5636] to-[#2e8b57]">
          <div className="absolute left-0 right-0 bottom-0 top-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 70%, #56A67C55 40%, transparent 80%)'}} />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Diet Plan Requests</h2>
                <p className="text-emerald-100 text-sm mt-1">Manage patient dietary consultations</p>
              </div>
            </div>
            <Link href="/doctor/diet-plans">
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white font-medium px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm border border-white/20">
                Open Diet Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 rounded-xl">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-900">Pending</h3>
                    <p className="text-amber-700 text-sm">Awaiting review</p>
                  </div>
                </div>
                <div className="bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">{pending.length}</div>
              </div>

              <div className="space-y-3">
                {pending.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-10 h-10 text-amber-300 mx-auto mb-3" />
                    <p className="text-amber-600 font-medium">No pending requests</p>
                    <p className="text-amber-500 text-sm">All caught up!</p>
                  </div>
                ) : (
                  pending.slice(0, 4).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => router.push('/doctor/diet-plans')}
                      className="cursor-pointer bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-amber-100 hover:border-amber-300"
                      role="button"
                      aria-label="Open diet plans"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <User className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 truncate">{r.patient?.name || `Patient #${r.patientId}`}</h4>
                            <div className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                              <Calendar className="w-3 h-3" />
                              {new Date(r.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-2">{r.complaint}</p>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Needs Review</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-900">Completed</h3>
                    <p className="text-emerald-700 text-sm">Successfully processed</p>
                  </div>
                </div>
                <div className="bg-emerald-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">{completed.length}</div>
              </div>

              <div className="space-y-3">
                {completed.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                    <p className="text-emerald-600 font-medium">No completed requests</p>
                    <p className="text-emerald-500 text-sm">Completed items will appear here</p>
                  </div>
                ) : (
                  completed.slice(0, 4).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => router.push('/doctor/diet-plans')}
                      className="cursor-pointer bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-emerald-100 hover:border-emerald-300"
                      role="button"
                      aria-label="Open diet plans"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <User className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 truncate">{r.patient?.name || `Patient #${r.patientId}`}</h4>
                            <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                              <Calendar className="w-3 h-3" />
                              {new Date(r.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Diet plan created and delivered</p>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


