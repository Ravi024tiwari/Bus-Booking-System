'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Eye, Edit2, Bus, Calendar, Ban, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { OperatorDetails } from '@/lib/admin-operators';
import { toast } from 'sonner';
import axios from 'axios';

interface OperatorTableProps {
  operators: OperatorDetails[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export default function OperatorTable({ operators, pagination, onPageChange, onRefresh }: OperatorTableProps) {
  const router = useRouter();
  const [selectedOperator, setSelectedOperator] = useState<OperatorDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const formatRevenue = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'APPROVED') return 'Active';
    if (status === 'PENDING') return 'Pending';
    if (status === 'REJECTED') return 'Suspended';
    return status;
  };

  const handleUpdateStatus = async (status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    if (!selectedOperator) return;

    try {
      const response = await axios.patch('/api/admin/operators', {
        operatorId: selectedOperator.id,
        status
      });

      if (response.data?.success) {
        toast.success(`Operator status updated to ${getStatusLabel(status)}`);
        setIsStatusModalOpen(false);
        setIsDetailOpen(false);
        onRefresh();
      } else {
        toast.error(response.data?.message || 'Failed to update status.');
      }
    } catch (err: any) {
      console.error('[Update Operator Status] Error:', err);
      toast.error(err.response?.data?.message || 'Error updating status.');
    }
  };

  const handleDeleteOperator = async (op: OperatorDetails) => {
    toast.warning(`Deletion of operator "${op.name}" requested. Delete API hook will run.`);
  };

  const handleExport = () => {
    toast.success('Exporting operators list as CSV...');
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[460px] group select-none">
      
      {/* Table Headers Action row */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">All Operators</h3>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/10 rounded-xl text-xs font-bold text-zinc-650 dark:text-zinc-300 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-x-auto mt-4">
        {operators.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 text-zinc-400">
            <Ban className="h-8 w-8 mb-2 opacity-35" />
            <span className="text-xs font-bold">No operators matched the filter criteria.</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase select-none">
                <th className="pb-3 pl-1">Operator</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3 text-center">Buses</th>
                <th className="pb-3 text-center">Routes</th>
                <th className="pb-3 text-center">Bookings</th>
                <th className="pb-3">Revenue</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Joined On</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/50 dark:divide-zinc-800/30 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {operators.map((op) => {
                const joinedDate = new Date(op.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                return (
                  <tr 
                    key={op.id} 
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors duration-150"
                  >
                    {/* Profile */}
                    <td className="py-3.5 pl-1 flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-indigo-200/50 dark:border-zinc-800/60 shrink-0">
                        <AvatarImage src={op.profileImage || ''} alt={op.name} className="object-cover" />
                        <AvatarFallback className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center">
                          {op.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-zinc-800 dark:text-zinc-200 truncate leading-none">
                          {op.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-1 leading-none truncate">
                          {op.email}
                        </span>
                      </div>
                    </td>

                    {/* Contact info */}
                    <td className="py-3.5 text-zinc-655 dark:text-zinc-400">
                      {op.phoneNumber}
                    </td>

                    {/* Buses count */}
                    <td className="py-3.5 text-center font-bold">
                      {op.busesCount}
                    </td>

                    {/* Routes count */}
                    <td className="py-3.5 text-center font-bold">
                      {op.routesCount}
                    </td>

                    {/* Bookings count */}
                    <td className="py-3.5 text-center font-bold text-zinc-505 dark:text-zinc-450">
                      {op.bookingsCount.toLocaleString()}
                    </td>

                    {/* Revenue */}
                    <td className="py-3.5 text-zinc-900 dark:text-white font-extrabold">
                      {formatRevenue(op.revenue)}
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5">
                      <span className={`inline-block px-2.5 py-1 border text-[10px] font-black rounded-full uppercase leading-none ${getStatusStyle(op.operatorApprovalStatus)}`}>
                        {getStatusLabel(op.operatorApprovalStatus)}
                      </span>
                    </td>

                    {/* Registration date */}
                    <td className="py-3.5 text-zinc-450 dark:text-zinc-500 font-medium">
                      {joinedDate}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 text-right pr-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer select-none p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 outline-none">
                          <MoreVertical className="h-4.5 w-4.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 p-1 shadow-lg z-30 select-none">
                          
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedOperator(op);
                              setIsDetailOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer outline-none w-full"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedOperator(op);
                              setNewStatus(op.operatorApprovalStatus);
                              setIsStatusModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer outline-none w-full"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit Operator
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-1" />

                          <DropdownMenuItem 
                            onClick={() => router.push(`/admin/buses?operator=${op.id}`)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer outline-none w-full"
                          >
                            <Bus className="h-3.5 w-3.5" />
                            View Buses
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => toast.success(`Showing bookings list filter for: ${op.name}`)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer outline-none w-full"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            View Bookings
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-1" />

                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedOperator(op);
                              handleUpdateStatus('REJECTED');
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer outline-none w-full"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Suspend Operator
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => handleDeleteOperator(op)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer outline-none w-full"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Operator
                          </DropdownMenuItem>

                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-150 dark:border-zinc-800/80 pt-4 mt-4 text-xs font-bold select-none text-zinc-500 shrink-0">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} operators)
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DETAIL DIALOG */}
      {isDetailOpen && selectedOperator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-end transition-opacity duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-[460px] h-full shadow-2xl p-6 flex flex-col justify-between border-l border-zinc-200/50 dark:border-zinc-800/50 relative">
            <button 
              onClick={() => setIsDetailOpen(false)}
              className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-800 dark:hover:text-white rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 outline-none"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col gap-6 mt-8 overflow-y-auto pr-1 flex-grow">
              <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                <Avatar className="h-16 w-16 border-2 border-indigo-500/20 shrink-0">
                  <AvatarImage src={selectedOperator.profileImage || ''} alt={selectedOperator.name} className="object-cover" />
                  <AvatarFallback className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-extrabold text-lg flex items-center justify-center">
                    {selectedOperator.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold text-zinc-900 dark:text-white leading-none">
                    {selectedOperator.name}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold mt-1.5 leading-none">
                    {selectedOperator.email}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block -mb-1">Operator Metadata</span>
                
                <div className="flex justify-between py-2 border-b border-dashed border-zinc-100 dark:border-zinc-850">
                  <span className="text-zinc-450 dark:text-zinc-500">Contact Number</span>
                  <span>{selectedOperator.phoneNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-zinc-100 dark:border-zinc-850">
                  <span className="text-zinc-450 dark:text-zinc-500">Registered Buses</span>
                  <span>{selectedOperator.busesCount} buses</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-zinc-100 dark:border-zinc-850">
                  <span className="text-zinc-450 dark:text-zinc-500">Routes Managed</span>
                  <span>{selectedOperator.routesCount} routes</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-zinc-100 dark:border-zinc-850">
                  <span className="text-zinc-450 dark:text-zinc-500">Total Bookings</span>
                  <span>{selectedOperator.bookingsCount.toLocaleString()} bookings</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-zinc-100 dark:border-zinc-850">
                  <span className="text-zinc-450 dark:text-zinc-500">Earnings Summary</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">{formatRevenue(selectedOperator.revenue)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-zinc-100 dark:border-zinc-850">
                  <span className="text-zinc-450 dark:text-zinc-500">Approval State</span>
                  <span className={`inline-block px-2.5 py-1 border text-[10px] font-black rounded-full uppercase leading-none ${getStatusStyle(selectedOperator.operatorApprovalStatus)}`}>
                    {getStatusLabel(selectedOperator.operatorApprovalStatus)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-455 dark:text-zinc-500">Joined On</span>
                  <span>{new Date(selectedOperator.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Quick action buttons inside details panel */}
            <div className="border-t border-zinc-150 dark:border-zinc-850 pt-4 flex gap-3">
              <button
                onClick={() => {
                  setNewStatus(selectedOperator.operatorApprovalStatus);
                  setIsStatusModalOpen(true);
                }}
                className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs py-3 rounded-xl shadow-md cursor-pointer outline-none"
              >
                Change status
              </button>
              <button
                onClick={() => handleUpdateStatus('APPROVED')}
                disabled={selectedOperator.operatorApprovalStatus === 'APPROVED'}
                className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-250 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 font-black text-xs py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none"
              >
                Approve Operator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STATUS CONFIRMATION MODAL */}
      {isStatusModalOpen && selectedOperator && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 w-full max-w-[400px] rounded-3xl p-6 shadow-2xl flex flex-col gap-5 relative">
            <button 
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-800 dark:hover:text-white outline-none"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h4 className="font-extrabold text-base text-zinc-900 dark:text-white">
                Modify Approval Status
              </h4>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
                Updating approval permissions for {selectedOperator.name}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { key: 'APPROVED', label: 'Active (Approved)', style: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
                { key: 'PENDING', label: 'Pending Approval', style: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
                { key: 'REJECTED', label: 'Suspended (Rejected)', style: 'bg-rose-500/10 text-rose-600 border-rose-500/20' }
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setNewStatus(opt.key as any)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-extrabold flex items-center justify-between cursor-pointer outline-none transition-all ${
                    newStatus === opt.key 
                      ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 ring-2 ring-indigo-500/30' 
                      : 'border-zinc-200/40 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                  }`}
                >
                  {opt.label}
                  <span className={`inline-block h-4.5 w-4.5 rounded-full border-2 ${
                    newStatus === opt.key ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-300 dark:border-zinc-700'
                  }`} />
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-1">
              <button
                onClick={() => handleUpdateStatus(newStatus)}
                className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs py-2.5 rounded-xl shadow-md cursor-pointer outline-none"
              >
                Save status
              </button>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="flex-1 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-150 dark:hover:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/20 text-zinc-600 dark:text-zinc-300 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer outline-none"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
