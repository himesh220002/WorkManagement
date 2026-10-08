"use client";

import { useState } from "react";
import {
  assignProjectStaffAction,
  updateProjectAgendasAction,
  submitProjectChangeRequestAction,
  reviewProjectChangeRequestAction,
} from "@/actions/member";
import { useToast } from "@/components/ui/Toast";
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  Calendar,
  Lock,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileEdit,
  UserPlus,
} from "lucide-react";

interface ProjectRbacControllerProps {
  project: {
    _id: string;
    name: string;
    leadId?: any;
    memberIds?: any[];
    agendas?: string[];
    changeRequests?: any[];
    deadline?: string;
    status?: string;
  };
  allUsers: Array<{
    _id: string;
    name: string;
    role: string;
    position?: string;
  }>;
  currentRole: string;
  currentUserId?: string;
}

export default function ProjectRbacController({
  project,
  allUsers,
  currentRole,
  currentUserId,
}: ProjectRbacControllerProps) {
  const { success, error } = useToast();
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRequestsList, setShowRequestsList] = useState(false);

  // Form states
  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    project.leadId?._id?.toString() || project.leadId?.toString() || ""
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    (project.memberIds || []).map((m: any) => m._id?.toString() || m.toString())
  );
  const [agendasText, setAgendasText] = useState<string>(
    (project.agendas || []).join("\n")
  );
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [requestType, setRequestType] = useState<string>("agenda");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permissions based on user requirements
  const isSuperuser = currentRole === "superuser";
  const isOwner = currentRole === "owner";
  const isManager = currentRole === "manager";
  const isTeamLead = currentRole === "teamlead";
  const isEmployee = currentRole === "employee";

  // Manager, Owner, and Superuser can assign project staff & designate TL
  const canAssignStaff = isSuperuser || isOwner || isManager;

  // TL is project-centric: can edit if assigned as lead
  const assignedLeadIdStr = project.leadId?._id?.toString() || project.leadId?.toString();
  const isAssignedLead = isTeamLead && currentUserId && assignedLeadIdStr === currentUserId;

  // Who can edit agendas directly
  const canEditAgendas = isSuperuser || isOwner || isManager || isAssignedLead;

  // Who can approve change requests
  const canReviewRequests = isSuperuser || isOwner || isManager || isAssignedLead;

  // Resolve assigned lead and members names
  const assignedLead = allUsers.find((u) => u._id === assignedLeadIdStr);
  const assignedMembers = allUsers.filter((u) => selectedMemberIds.includes(u._id));
  const pendingRequests = (project.changeRequests || []).filter(
    (r) => r.status === "Pending"
  );

  const handleSaveStaffing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("projectId", project._id);
      fd.set("leadId", selectedLeadId);
      selectedMemberIds.forEach((id) => fd.append("memberIds", id));

      const res = await assignProjectStaffAction(fd);
      if (res.success) {
        success(res.message || "Project staff and Team Lead assigned!");
        setShowStaffModal(false);
      } else {
        error(res.error || "Failed to assign staff");
      }
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAgendas = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("projectId", project._id);
      fd.set("agendas", agendasText);

      const res = await updateProjectAgendasAction(fd);
      if (res.success) {
        success(res.message || "Project agendas updated!");
        setShowAgendaModal(false);
      } else {
        error(res.error || "Failed to update agendas");
      }
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("projectId", project._id);
      fd.set("title", requestTitle);
      fd.set("description", requestDescription);
      fd.set("type", requestType);

      const res = await submitProjectChangeRequestAction(fd);
      if (res.success) {
        success(res.message || "Change request submitted to Team Lead!");
        setShowRequestModal(false);
        setRequestTitle("");
        setRequestDescription("");
      } else {
        error(res.error || "Failed to submit request");
      }
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewDecision = async (
    requestId: string,
    decision: "Approved" | "Rejected",
    note = ""
  ) => {
    try {
      const fd = new FormData();
      fd.set("projectId", project._id);
      fd.set("requestId", requestId);
      fd.set("decision", decision);
      fd.set("reviewNote", note);

      const res = await reviewProjectChangeRequestAction(fd);
      if (res.success) {
        success(res.message || `Request ${decision}`);
      } else {
        error(res.error || "Failed to review request");
      }
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="border-t border-[#EDEBE9] dark:border-[#292827] pt-3.5 mt-3 space-y-3">
      {/* 1. Staffing & Roles Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Designated Team Lead */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold text-[11px]">Designated Team Lead:</span>
            <strong className="text-purple-950 dark:text-purple-100">
              {assignedLead ? assignedLead.name : "Unassigned"}
            </strong>
          </div>

          {/* Assigned Staff Count */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#EDEBE9] dark:border-[#292827] text-[#605E5C] dark:text-[#C8C6C4] text-[11px]">
            <Users className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>
              {assignedMembers.length > 0
                ? `${assignedMembers.length} Employees Assigned`
                : "No members assigned"}
            </span>
          </div>

          {/* Pending Changes Badge */}
          {pendingRequests.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRequestsList(!showRequestsList)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-[11px] font-bold hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>{pendingRequests.length} Change Proposals</span>
              {showRequestsList ? (
                <ChevronUp className="w-3 h-3 ml-0.5" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Manager / Owner: Staffing assignment */}
          {canAssignStaff && (
            <button
              type="button"
              onClick={() => setShowStaffModal(true)}
              className="px-2.5 py-1 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Assign Staff &amp; TL</span>
            </button>
          )}

          {/* TL / Manager: Direct agenda edit */}
          {canEditAgendas ? (
            <button
              type="button"
              onClick={() => setShowAgendaModal(true)}
              className="px-2.5 py-1 bg-[#EDEBE9] dark:bg-[#3B3A39] hover:bg-[#E1DFDD] text-[#242424] dark:text-white rounded-[4px] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>Edit Agendas</span>
            </button>
          ) : isEmployee ? (
            <button
              type="button"
              onClick={() => setShowRequestModal(true)}
              className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 rounded-[4px] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Employees cannot edit project settings directly. Submit a change proposal to your Team Lead."
            >
              <Send className="w-3.5 h-3.5 text-amber-600" />
              <span>Request Project Change</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* 2. Project Strategic Agendas Accordion */}
      {(project.agendas && project.agendas.length > 0) && (
        <div className="p-3 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#EDEBE9] dark:border-[#292827] rounded-[6px] text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[#242424] dark:text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>Project Agendas &amp; Delivery Milestones</span>
            </span>
            {isEmployee && (
              <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Protected Timeline (TL Governed)</span>
              </span>
            )}
          </div>
          <ul className="space-y-1.5 pl-4 list-disc text-[#605E5C] dark:text-[#C8C6C4]">
            {project.agendas.map((agenda, idx) => (
              <li key={idx} className="leading-relaxed">
                {agenda}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Pending Change Proposals Review Box */}
      {showRequestsList && pendingRequests.length > 0 && (
        <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-[6px] text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Employee Change Proposals Awaiting Review</span>
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400">
              {canReviewRequests ? "You have approval authority" : "Read-only view"}
            </span>
          </div>

          <div className="divide-y divide-amber-200/60 dark:divide-amber-800/60">
            {pendingRequests.map((req) => (
              <div key={req._id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-amber-950 dark:text-amber-100">
                        {req.title}
                      </strong>
                      <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                        {req.type}
                      </span>
                    </div>
                    {req.description && (
                      <p className="text-[11px] text-amber-900 dark:text-amber-200 mt-1">
                        {req.description}
                      </p>
                    )}
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 block">
                      Submitted by {req.requesterName}
                    </span>
                  </div>

                  {canReviewRequests && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleReviewDecision(req._id, "Approved")}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewDecision(req._id, "Rejected")}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: STAFFING & TEAM LEAD ================= */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 max-w-lg w-full shadow-xl">
            <h3 className="text-sm font-bold text-[#242424] dark:text-white mb-1">
              Assign Project Staff &amp; Designate Team Lead
            </h3>
            <p className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] mb-4">
              Operations Managers decide project personnel and assign which employee serves as Team Lead.
            </p>

            <form onSubmit={handleSaveStaffing} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#242424] dark:text-white mb-1">
                  Designated Team Lead (TL) *
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white cursor-pointer"
                >
                  <option value="">-- Select Team Lead --</option>
                  {allUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role?.toUpperCase()}) {u.position ? `• ${u.position}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#242424] dark:text-white mb-1">
                  Assign Project Member Engineers / Staff
                </label>
                <div className="max-h-40 overflow-y-auto border border-[#E1DFDD] dark:border-[#3B3A39] rounded p-2 space-y-1.5 bg-[#FAF9F8] dark:bg-[#1B1A19]">
                  {allUsers.map((u) => {
                    const isChecked = selectedMemberIds.includes(u._id);
                    return (
                      <label
                        key={u._id}
                        className="flex items-center gap-2 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMemberIds([...selectedMemberIds, u._id]);
                            } else {
                              setSelectedMemberIds(selectedMemberIds.filter((id) => id !== u._id));
                            }
                          }}
                          className="rounded border-[#E1DFDD]"
                        />
                        <span className="font-medium text-[#242424] dark:text-white">{u.name}</span>
                        <span className="text-[10px] text-[#605E5C] dark:text-[#A19F9D]">
                          ({u.role}) {u.position ? `• ${u.position}` : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-[#3B3A39] text-[#242424] dark:text-white rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded text-xs font-semibold cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Assignments"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT AGENDAS ================= */}
      {showAgendaModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 max-w-lg w-full shadow-xl">
            <h3 className="text-sm font-bold text-[#242424] dark:text-white mb-1">
              Edit Project Agendas &amp; Milestones
            </h3>
            <p className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] mb-3">
              One milestone or agenda item per line.
            </p>

            <form onSubmit={handleSaveAgendas} className="space-y-3 text-xs">
              <textarea
                rows={5}
                value={agendasText}
                onChange={(e) => setAgendasText(e.target.value)}
                placeholder="Sprint 1: Architecture review&#10;Sprint 2: Alpha core microservice release&#10;Sprint 3: Enterprise UAT validation"
                className="w-full p-2.5 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4] font-mono"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAgendaModal(false)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-[#3B3A39] text-[#242424] dark:text-white rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded text-xs font-semibold cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Update Agendas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: REQUEST CHANGE (EMPLOYEE) ================= */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 max-w-lg w-full shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-[#242424] dark:text-white">
                Request Project Change from Team Lead
              </h3>
            </div>
            <p className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] mb-3">
              Employees have read-only access to timelines and agendas. Submit your proposed adjustment for Team Lead review.
            </p>

            <form onSubmit={handleSubmitRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#242424] dark:text-white mb-1">
                  Change Proposal Title *
                </label>
                <input
                  type="text"
                  required
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="e.g. Extend API integration phase by 2 days"
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#242424] dark:text-white mb-1">
                  Category *
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white cursor-pointer"
                >
                  <option value="agenda">Project Agenda / Objective Change</option>
                  <option value="timeline">Timeline / Milestone Schedule Change</option>
                  <option value="scope">Technical Scope Adjustment</option>
                  <option value="deadline">Sprint Deadline Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#242424] dark:text-white mb-1">
                  Justification &amp; Technical Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Third-party payment gateway staging webhook requires additional security compliance verification."
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-[#3B3A39] text-[#242424] dark:text-white rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  {isSubmitting ? "Submitting..." : "Send Proposal to TL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
