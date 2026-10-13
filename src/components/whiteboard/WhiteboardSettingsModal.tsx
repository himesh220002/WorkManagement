"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  Key,
  Copy,
  Check,
  RefreshCw,
  X,
  AlertTriangle,
  User,
  Sliders,
  Edit3,
  ShieldCheck,
  Clock,
  Unlock,
} from "lucide-react";

export interface WhiteboardSecuritySettings {
  _id: string;
  title: string;
  authorName?: string;
  authorId?: string;
  isProtected?: boolean;
  securityType?: "pin" | "password";
  deleteRequiresPass?: boolean;
  publicEdit?: boolean;
  tempTokenPhrase?: string;
}

export interface WhiteboardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: WhiteboardSecuritySettings;
  currentUserId?: string;
  currentUserName?: string;
  onSaveSuccess?: (updated: WhiteboardSecuritySettings) => void;
  onUnlockSuccess?: (token: string, expiresAt: number) => void;
}

export { WhiteboardSettingsModal };
export default function WhiteboardSettingsModal({
  isOpen,
  onClose,
  board,
  currentUserId,
  currentUserName,
  onSaveSuccess,
  onUnlockSuccess,
}: WhiteboardSettingsModalProps) {
  // Determine if the current user created this whiteboard
  const isCreator = Boolean(
    (currentUserId && board.authorId && currentUserId === board.authorId) ||
    (currentUserName && board.authorName && (
      currentUserName.trim().toLowerCase() === board.authorName.trim().toLowerCase() ||
      board.authorName.toLowerCase().includes(currentUserName.trim().toLowerCase()) ||
      currentUserName.toLowerCase().includes(board.authorName.trim().toLowerCase())
    ))
  );

  // Settings state (for creator)
  const [deleteRequiresPass, setDeleteRequiresPass] = useState<boolean>(
    board.deleteRequiresPass !== undefined ? Boolean(board.deleteRequiresPass) : true
  );
  const [publicEdit, setPublicEdit] = useState<boolean>(
    board.publicEdit !== undefined ? Boolean(board.publicEdit) : true
  );
  const [tempTokenPhrase, setTempTokenPhrase] = useState<string>(
    board.tempTokenPhrase || Math.floor(100000 + Math.random() * 900000).toString()
  );

  // Password / PIN Change State (for creator)
  const [showPasswordChange, setShowPasswordChange] = useState<boolean>(false);
  const [changeSecType, setChangeSecType] = useState<"pin" | "password">(
    board.securityType || "pin"
  );
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");

  // Non-creator: 5-Hour Edit Permission State
  const [tokenInput, setTokenInput] = useState<string>("");
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string>("");
  const [activeGrantExpiresAt, setActiveGrantExpiresAt] = useState<number | null>(null);
  const [showTokenInputAnyway, setShowTokenInputAnyway] = useState<boolean>(false);

  // UI state
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Check existing 5-hour grant in localStorage for non-creators
  useEffect(() => {
    if (!isOpen || !board._id || typeof window === "undefined") return;
    try {
      const grantStr = localStorage.getItem(`wb_edit_grant_${board._id}`);
      if (grantStr) {
        const grant = JSON.parse(grantStr);
        if (grant?.expiresAt && grant.expiresAt > Date.now()) {
          setActiveGrantExpiresAt(grant.expiresAt);
        } else {
          localStorage.removeItem(`wb_edit_grant_${board._id}`);
          setActiveGrantExpiresAt(null);
        }
      } else {
        setActiveGrantExpiresAt(null);
      }
    } catch {
      setActiveGrantExpiresAt(null);
    }
  }, [isOpen, board._id]);

  if (!isOpen) return null;

  // Copy 6-digit token phrase (creator only)
  const handleCopyPhrase = () => {
    if (!tempTokenPhrase) return;
    navigator.clipboard?.writeText(tempTokenPhrase);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Regenerate 6-digit token phrase (creator only)
  const handleRegeneratePhrase = () => {
    setIsRegenerating(true);
    const newPhrase = Math.floor(100000 + Math.random() * 900000).toString();
    setTempTokenPhrase(newPhrase);
    setTimeout(() => setIsRegenerating(false), 200);
  };

  // Save Settings (Creator only)
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload: any = {
        deleteRequiresPass,
        publicEdit,
        tempTokenPhrase,
      };

      // Password change verification if requested
      if (showPasswordChange) {
        if (board.isProtected && !currentPassword.trim()) {
          setErrorMessage("Current PIN/password is required to set a new password.");
          setIsSaving(false);
          return;
        }

        if (!newPassword.trim()) {
          setErrorMessage("Please enter the new PIN or password.");
          setIsSaving(false);
          return;
        }

        if (changeSecType === "pin") {
          if (!/^\d{4}$/.test(newPassword.trim())) {
            setErrorMessage("4-digit PIN must contain exactly 4 numeric digits.");
            setIsSaving(false);
            return;
          }
        } else {
          if (newPassword.trim().length < 6) {
            setErrorMessage("Password must be at least 6 characters long.");
            setIsSaving(false);
            return;
          }
        }

        if (newPassword.trim() !== confirmNewPassword.trim()) {
          setErrorMessage("New password and confirmation do not match.");
          setIsSaving(false);
          return;
        }

        payload.changePassword = true;
        payload.currentPassword = currentPassword.trim();
        payload.newPassword = newPassword.trim();
        payload.newSecurityType = changeSecType;
      }

      const res = await fetch(`/api/whiteboards/${board._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to save whiteboard settings.");
        return;
      }

      setSuccessMessage("Settings saved successfully!");
      if (onSaveSuccess && data.whiteboard) {
        onSaveSuccess(data.whiteboard);
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Failed to save whiteboard settings:", err);
      setErrorMessage(err.message || "Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Unlock 5-Hour Edit Access (Non-creator)
  const handleUnlockWithToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      setUnlockError("Please enter the 6-digit approval token phrase or master PIN.");
      return;
    }

    try {
      setIsVerifyingToken(true);
      setUnlockError("");
      setSuccessMessage("");

      const res = await fetch(`/api/whiteboards/${board._id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenOrPass: cleanToken }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setUnlockError(data.error || "Incorrect token phrase. Ask the whiteboard creator for approval.");
        return;
      }

      const fiveHoursMs = 5 * 60 * 60 * 1000;
      const expiresAt = data.expiresAt || Date.now() + fiveHoursMs;
      const grant = { token: cleanToken, expiresAt };
      localStorage.setItem(`wb_edit_grant_${board._id}`, JSON.stringify(grant));
      localStorage.setItem(`wb_edit_token_${board._id}`, cleanToken);
      setActiveGrantExpiresAt(expiresAt);
      setShowTokenInputAnyway(false);
      setTokenInput("");
      setSuccessMessage(data.message || "✓ 5-Hour Edit Permission Granted! You can now edit and push changes.");

      if (onUnlockSuccess) {
        onUnlockSuccess(cleanToken, expiresAt);
      }
    } catch (err: any) {
      setUnlockError(err.message || "Failed to verify access token.");
    } finally {
      setIsVerifyingToken(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#14151B] border border-[#2B2E3A] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-gray-200 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#22242D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isCreator ? "Whiteboard Security & Permissions" : "Whiteboard Access & Permissions"}
              </h3>
              <p className="text-[11px] text-gray-400 truncate max-w-xs">{board.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Creator Info Card */}
        <div className="mt-4 p-3 rounded-lg bg-[#181A22] border border-[#272A36] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">Whiteboard Creator:</div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{board.authorName || currentUserName || "Team Member"}</span>
                {isCreator && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold">
                    You
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 max-w-[190px] text-right">
            {isCreator
              ? "You have master control over this whiteboard's security & policies."
              : "Office colleagues contact this creator for edit approval."}
          </span>
        </div>

        {/* ========================================================
            NON-CREATOR VIEW: NO CHECKBOXES, NO REGENERATE, NO PASSWORD CHANGE.
            SHOWS 5-HOUR EDIT TOKEN UNLOCK FIELD.
           ======================================================== */}
        {!isCreator ? (
          <div className="mt-4 space-y-4 text-xs">
            {/* Status overview banner */}
            <div className="p-3 rounded-lg bg-[#181A22] border border-[#272A36] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {board.publicEdit !== false ? (
                  <Unlock className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-400" />
                )}
                <span className="font-semibold text-white">Public Edit Mode:</span>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  board.publicEdit !== false
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                }`}
              >
                {board.publicEdit !== false ? "Public Edit Enabled" : "Restricted (Approval Required)"}
              </span>
            </div>

            {/* Active 5-Hour Permission Badge (if already active) */}
            {activeGrantExpiresAt && activeGrantExpiresAt > Date.now() && !showTokenInputAnyway && (
              <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>5-Hour Edit Permission Active</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    Unlocked
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                  You currently have permission to edit and push changes to this whiteboard.
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20 text-[11px] text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      Expires: {new Date(activeGrantExpiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (~{Math.ceil((activeGrantExpiresAt - Date.now()) / (60 * 60 * 1000))}h left)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTokenInputAnyway(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                  >
                    Use Another Token
                  </button>
                </div>
              </div>
            )}

            {/* 5-Hour Token Input Section */}
            {(!activeGrantExpiresAt || activeGrantExpiresAt <= Date.now() || showTokenInputAnyway) && (
              <form onSubmit={handleUnlockWithToken} className="p-3.5 rounded-lg bg-[#181A22] border border-[#272A36] space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-white">Temporary Edit Permission (5 Hours)</span>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Enter the 6-digit approval token phrase asked from the whiteboard creator (
                  <strong className="text-gray-200">{board.authorName || "the creator"}</strong>) to unlock 5 hours of edit permissions.
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Enter 6-digit token (e.g. 849201) or PIN"
                    maxLength={20}
                    className="w-full px-3 py-2 rounded-md bg-[#0D0E12] border border-[#2A2C38] text-amber-300 placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm font-mono tracking-widest text-center"
                  />

                  <button
                    type="submit"
                    disabled={isVerifyingToken || !tokenInput.trim()}
                    className="w-full py-2 px-3 rounded-md text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isVerifyingToken ? "Verifying Token..." : "Unlock 5-Hour Edit Permission"}</span>
                  </button>
                </div>

                {showTokenInputAnyway && activeGrantExpiresAt && activeGrantExpiresAt > Date.now() && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowTokenInputAnyway(false)}
                      className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
                    >
                      Cancel and keep active permission
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Error & Success Messages */}
            {unlockError && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{unlockError}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Footer Close Button */}
            <div className="flex items-center justify-end pt-3 border-t border-[#22242D]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#21232D] hover:bg-[#2A2D3A] text-white border border-[#343746] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
              CREATOR VIEW: FULL CONTROLS WITH CHECKBOXES,
              REGENERATE TOKEN PHRASE, AND PASSWORD CHANGER.
             ======================================================== */
          <div className="mt-4 space-y-4 text-xs">
            {/* Checkbox 1: Delete Whiteboard Needed Pass */}
            <div className="p-3.5 rounded-lg bg-[#181A22] border border-[#272A36]">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteRequiresPass}
                  onChange={(e) => setDeleteRequiresPass(e.target.checked)}
                  className="mt-0.5 rounded bg-[#0F1014] border-[#343746] text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete whiteboard needed pass</span>
                    {deleteRequiresPass && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 ml-2">
                        Checked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                    When checked, anyone attempting to delete this whiteboard must enter the 4-digit PIN
                    or master password. Prevents accidental deletion.
                  </p>
                </div>
              </label>
            </div>

            {/* Checkbox 2: Public Edit */}
            <div className="p-3.5 rounded-lg bg-[#181A22] border border-[#272A36]">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={publicEdit}
                  onChange={(e) => setPublicEdit(e.target.checked)}
                  className="mt-0.5 rounded bg-[#0F1014] border-[#343746] text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Public edit</span>
                    {publicEdit && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 ml-2">
                        Checked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                    When checked, all office teammates can edit directly. When unchecked, others are in
                    view-only mode and must enter your 6-digit approval token to unlock editing.
                  </p>
                </div>
              </label>
            </div>

            {/* 6-Digit Temporary Token Phrase (Creator view: WITH REGENERATE) */}
            <div className="p-3.5 rounded-lg bg-[#181A22] border border-[#272A36] space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Temporary Token Phrase (6-Digit)</span>
                </div>
                <button
                  type="button"
                  onClick={handleRegeneratePhrase}
                  disabled={isRegenerating}
                  className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  title="Generate a new 6-digit code"
                >
                  <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} />
                  <span>Regenerate</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                Share this 6-digit phrase with office colleagues when they ask for permission to edit.
                They can use it to unlock 5 hours of edit access without knowing your master password.
              </p>

              {/* Display Token Phrase Box */}
              <div className="flex items-center justify-between p-2.5 rounded-md bg-[#0D0E12] border border-[#282B37]">
                <div className="font-mono text-base font-bold text-amber-300 tracking-[0.25em] pl-1">
                  {tempTokenPhrase}
                </div>
                <button
                  type="button"
                  onClick={handleCopyPhrase}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    isCopied
                      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50"
                      : "bg-[#21232D] hover:bg-[#2A2D3A] text-gray-200 border border-[#343746]"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Phrase</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Password / PIN Change Accordion */}
            <div className="p-3.5 rounded-lg bg-[#181A22] border border-[#272A36] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-white">Password / PIN Change</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#252835] text-gray-300">
                    {board.isProtected
                      ? board.securityType === "password"
                        ? "Password Protected"
                        : "PIN Protected"
                      : "No Password"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
                >
                  {showPasswordChange ? "Cancel" : "Change / Set Code"}
                </button>
              </div>

              {showPasswordChange && (
                <div className="space-y-3 pt-2 border-t border-[#252835] animate-in fade-in-50">
                  {/* Security Type Switcher */}
                  <div>
                    <span className="block text-[11px] font-medium text-gray-300 mb-1">
                      Select Protection Type:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setChangeSecType("pin")}
                        className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                          changeSecType === "pin"
                            ? "bg-blue-600/30 border-blue-500/60 text-white"
                            : "bg-[#0F1014] border-[#2E313F] text-gray-400 hover:text-white"
                        }`}
                      >
                        <Key className="w-3 h-3" />
                        <span>4-Digit PIN</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setChangeSecType("password")}
                        className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                          changeSecType === "password"
                            ? "bg-blue-600/30 border-blue-500/60 text-white"
                            : "bg-[#0F1014] border-[#2E313F] text-gray-400 hover:text-white"
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>6-Char Password</span>
                      </button>
                    </div>
                  </div>

                  {/* If already protected, require current password */}
                  {board.isProtected && (
                    <div>
                      <label className="block text-[11px] font-medium text-gray-300 mb-1">
                        Current PIN or Password:
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current PIN/password"
                        className="w-full px-3 py-1.5 rounded-md bg-[#0D0E12] border border-[#2A2C38] text-white focus:outline-none focus:border-blue-500 text-xs font-mono"
                      />
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      {changeSecType === "pin" ? "New 4-Digit PIN:" : "New Password (min 6 chars):"}
                    </label>
                    <input
                      type="password"
                      maxLength={changeSecType === "pin" ? 4 : undefined}
                      value={newPassword}
                      onChange={(e) => {
                        const val = changeSecType === "pin" ? e.target.value.replace(/\D/g, "") : e.target.value;
                        setNewPassword(val);
                      }}
                      placeholder={changeSecType === "pin" ? "e.g. 5928" : "e.g. TeamWhiteboard2026"}
                      className="w-full px-3 py-1.5 rounded-md bg-[#0D0E12] border border-[#2A2C38] text-white focus:outline-none focus:border-blue-500 text-xs font-mono"
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      Confirm {changeSecType === "pin" ? "PIN:" : "Password:"}
                    </label>
                    <input
                      type="password"
                      maxLength={changeSecType === "pin" ? 4 : undefined}
                      value={confirmNewPassword}
                      onChange={(e) => {
                        const val = changeSecType === "pin" ? e.target.value.replace(/\D/g, "") : e.target.value;
                        setConfirmNewPassword(val);
                      }}
                      placeholder="Re-enter to confirm"
                      className="w-full px-3 py-1.5 rounded-md bg-[#0D0E12] border border-[#2A2C38] text-white focus:outline-none focus:border-blue-500 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Feedback messages */}
            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Footer Actions for Creator */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#22242D]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-white hover:bg-[#1E2028] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveSettings}
                className="px-4 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? "Saving Settings..." : "Save Settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
