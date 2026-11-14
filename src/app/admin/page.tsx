"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth";
import { UserRole, ROLE_LABELS } from "@/lib/rls";
import {
  listUserAccounts,
  createUserAccount,
  updateUserAccountRole,
  deleteUserAccount,
  getMedicalLists,
  addOrUpdateMedicalListItem,
  deleteMedicalListItem,
  getLabRanges,
  updateLabRangeConfig,
  listRecentAuditChanges,
  exportDatabaseBackup,
  restoreDatabaseFromBackup,
  resetDbToSeed,
} from "@/lib/db";
import {
  Users,
  ClipboardList,
  Sliders,
  History,
  DatabaseBackup,
  Plus,
  Trash2,
  Edit3,
  Save,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
};

type AdminSection =
  | "users"
  | "medical_lists"
  | "scoring_labs"
  | "audit_log"
  | "backup";

type MedicalCategory = "investigation" | "symptom" | "diagnosis" | "specialty";

export default function SystemManagementPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>("users");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    window.addEventListener("sarcoscore-db-updated", refresh);
    return () => window.removeEventListener("sarcoscore-db-updated", refresh);
  }, [refresh]);

  const isAdmin = user?.role === "admin";
  const accounts = isAdmin ? listUserAccounts(user) : [];
  const medicalLists = isAdmin ? getMedicalLists() : [];
  const labRanges = isAdmin ? getLabRanges() : [];
  const auditLogs = isAdmin ? listRecentAuditChanges(user) : [];

  // --------------------------------------------------------------------------
  // SECTION 1: USER ACCOUNTS & ROLES STATE
  // --------------------------------------------------------------------------
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("doctor");
  const [newUserPassword, setNewUserPassword] = useState("demo1234");

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const created = createUserAccount(user, {
        email: newUserEmail,
        fullName: newUserName,
        role: newUserRole,
        password: newUserPassword,
      });
      setNewUserEmail("");
      setNewUserName("");
      setNotice(
        `Created account ${created.email} (${ROLE_LABELS[created.role]}).`
      );
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    }
  };

  const handleRoleChange = (targetUserId: string, nextRole: UserRole) => {
    setError(null);
    setNotice(null);
    try {
      updateUserAccountRole(user, targetUserId, nextRole);
      setNotice(`Updated user role to ${ROLE_LABELS[nextRole]}.`);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    }
  };

  const handleDeleteUser = (targetUserId: string, email: string) => {
    setError(null);
    setNotice(null);
    try {
      deleteUserAccount(user, targetUserId);
      setNotice(`Deleted user account ${email}.`);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user.");
    }
  };

  // --------------------------------------------------------------------------
  // SECTION 2: MEDICAL LISTS STATE (Investigations, Symptoms, Diagnoses, Specialties)
  // --------------------------------------------------------------------------
  const [listCategory, setListCategory] =
    useState<MedicalCategory>("symptom");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemGroup, setItemGroup] = useState("General");
  const [itemPoints, setItemPoints] = useState("1");

  const filteredListItems = medicalLists.filter(
    (m) => m.category === listCategory
  );

  const handleSaveMedicalItem = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!itemName.trim()) {
      setError("Item name is required.");
      return;
    }
    try {
      const saved = addOrUpdateMedicalListItem(user, {
        id: editingItemId ?? undefined,
        category: listCategory,
        name: itemName,
        groupName: itemGroup,
        points:
          listCategory === "symptom" ? Number.parseInt(itemPoints, 10) || 0 : undefined,
      });
      setEditingItemId(null);
      setItemName("");
      setNotice(
        `Saved ${saved.category} "${saved.name}" and logged change to audit_log.`
      );
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save item.");
    }
  };

  const handleStartEditMedicalItem = (item: (typeof medicalLists)[0]) => {
    setEditingItemId(item.id);
    setListCategory(item.category);
    setItemName(item.name);
    setItemGroup(item.groupName);
    setItemPoints(String(item.points ?? 0));
  };

  const handleDeleteMedicalItem = (id: string, name: string) => {
    setError(null);
    setNotice(null);
    try {
      deleteMedicalListItem(user, id);
      setNotice(`Removed "${name}" from medical lists.`);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete item.");
    }
  };

  // --------------------------------------------------------------------------
  // SECTION 3: SCORING & LAB RANGES STATE
  // --------------------------------------------------------------------------
  const [labEdits, setLabEdits] = useState<
    Record<string, { low: string; high: string; max_points: string }>
  >({});
  const [symptomPointEdits, setSymptomPointEdits] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!isAdmin) return;
    const nextLabs: Record<
      string,
      { low: string; high: string; max_points: string }
    > = {};
    for (const l of getLabRanges()) {
      nextLabs[l.id] = {
        low: String(l.low),
        high: String(l.high),
        max_points: String(l.max_points),
      };
    }
    setLabEdits(nextLabs);

    const nextSym: Record<string, string> = {};
    for (const m of getMedicalLists().filter((x) => x.category === "symptom")) {
      nextSym[m.id] = String(m.points ?? 0);
    }
    setSymptomPointEdits(nextSym);
  }, [isAdmin]);

  const handleSaveLabRange = (labId: string) => {
    setError(null);
    setNotice(null);
    const edit = labEdits[labId];
    if (!edit) return;
    try {
      const updated = updateLabRangeConfig(user, labId, {
        low: Number.parseFloat(edit.low),
        high: Number.parseFloat(edit.high),
        max_points: Number.parseInt(edit.max_points, 10),
      });
      setNotice(
        `Updated ${updated.label} normal range (${updated.low}–${updated.high} ${updated.unit}, max +${updated.max_points} pts).`
      );
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update lab range.");
    }
  };

  const handleSaveSymptomPoints = (item: (typeof medicalLists)[0]) => {
    setError(null);
    setNotice(null);
    const rawPts = symptomPointEdits[item.id] ?? String(item.points ?? 0);
    try {
      const updated = addOrUpdateMedicalListItem(user, {
        id: item.id,
        category: "symptom",
        name: item.name,
        groupName: item.groupName,
        points: Number.parseInt(rawPts, 10) || 0,
      });
      setNotice(
        `Updated score weight for "${updated.name}" to ${
          (updated.points ?? 0) > 0 ? `+${updated.points}` : updated.points
        } pts.`
      );
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update points.");
    }
  };

  // --------------------------------------------------------------------------
  // SECTION 5: BACKUP & RESTORE STATE (WITH CONFIRMATION STEP)
  // --------------------------------------------------------------------------
  const [stagedBackupJson, setStagedBackupJson] = useState<string>("");
  const [stagedBackupSummary, setStagedBackupSummary] = useState<{
    usersCount: number;
    patientsCount: number;
    visitsCount: number;
    auditCount: number;
  } | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleDownloadBackup = () => {
    setError(null);
    setNotice(null);
    try {
      const jsonString = exportDatabaseBackup(user);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sarcoscore-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotice(
        "Downloaded full system backup JSON and logged EXPORT_SYSTEM_BACKUP."
      );
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backup export failed.");
    }
  };

  const handleBackupFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setNotice(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed.users) || !Array.isArray(parsed.patients)) {
          throw new Error("Selected JSON file is not a valid SarcoScore backup.");
        }
        setStagedBackupJson(text);
        setStagedBackupSummary({
          usersCount: parsed.users.length,
          patientsCount: parsed.patients.length,
          visitsCount: Array.isArray(parsed.visits) ? parsed.visits.length : 0,
          auditCount: Array.isArray(parsed.auditLog) ? parsed.auditLog.length : 0,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Invalid backup JSON file."
        );
        setStagedBackupJson("");
        setStagedBackupSummary(null);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    setError(null);
    setNotice(null);
    try {
      restoreDatabaseFromBackup(user, stagedBackupJson);
      setStagedBackupJson("");
      setStagedBackupSummary(null);
      setNotice(
        "System state successfully restored from backup file and logged to audit_log."
      );
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed.");
    }
  };

  const handleConfirmFactoryReset = () => {
    resetDbToSeed();
    setConfirmResetOpen(false);
    setNotice("Database reset to initial seeded demo state.");
    refresh();
  };

  const SECTION_TABS: {
    id: AdminSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "users", label: "1. User Accounts & Roles", icon: Users },
    { id: "medical_lists", label: "2. Medical Lists", icon: ClipboardList },
    { id: "scoring_labs", label: "3. Scoring & Lab Ranges", icon: Sliders },
    {
      id: "audit_log",
      label: `4. Review Changes (${auditLogs.length})`,
      icon: History,
    },
    { id: "backup", label: "5. Backup & Restore", icon: DatabaseBackup },
  ];

  return (
    <RoleGuard feature="system_management" featureTitle="System Management">
      <div className="mx-auto max-w-[1140px] px-5 py-10 md:px-10 md:py-16 lg:px-16 space-y-8">
        {/* Page Header */}
        <motion.div {...fadeUp} className="border-b border-border pb-6">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
            ADMINISTRATOR ONLY · SYSTEM MANAGEMENT
          </span>
          <h1 className="font-serif text-3xl md:text-[42px] font-medium text-foreground leading-[1.14]">
            System Management
          </h1>
          <p className="mt-2 text-[17px] text-muted-foreground max-w-2xl leading-relaxed">
            Manage user accounts and role assignments, clinical lists, scoring
            weights and laboratory reference ranges, the 200-entry audit trail,
            and system backups.
          </p>
        </motion.div>

        {/* 5 Section Tabs */}
        <div className="flex flex-wrap gap-2">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveSection(tab.id);
                setError(null);
                setNotice(null);
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[14px] font-semibold transition-colors",
                activeSection === tab.id
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:bg-background"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Feedback Banners */}
        {notice && (
          <div className="flex items-center justify-between rounded-xl border border-[#2E8B57]/40 bg-[#2E8B57]/10 px-4 py-3 text-[14px] text-[#2E8B57]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-[12px] font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#C0504D]/40 bg-[#C0504D]/10 px-4 py-3 text-[14px] text-[#C0504D]">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-[12px] font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ===================================================================
            SECTION 1: USER ACCOUNTS & ROLES
           =================================================================== */}
        {activeSection === "users" && (
          <motion.section
            {...fadeUp}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Create Account Form */}
            <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-6">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                New Account
              </span>
              <h2 className="font-serif text-xl font-medium text-foreground mb-4">
                Create User Account
              </h2>

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Dr. Ahmed Mansour"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="ahmed@sarcoscore.demo"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-1">
                    Assigned Role *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="researcher">Researcher</option>
                    <option value="admin">Administrator</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-1">
                    Initial Password
                  </label>
                  <input
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-[13px] text-foreground"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Account</span>
                </button>
              </form>
            </div>

            {/* Accounts Table */}
            <div className="lg:col-span-8 rounded-2xl border border-border bg-card p-6">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                Directory ({accounts.length} Users)
              </span>
              <h2 className="font-serif text-xl font-medium text-foreground mb-4">
                User Accounts &amp; Role Management
              </h2>

              <div className="overflow-x-auto rounded-xl border border-border bg-background">
                <table className="w-full text-left border-collapse text-[14px]">
                  <thead>
                    <tr className="border-b border-border bg-card/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">Full Name &amp; Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {accounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-card/40">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-foreground">
                            {acc.fullName}
                          </p>
                          <p className="text-[12px] font-mono text-muted-foreground">
                            {acc.email}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            aria-label={`Role for ${acc.email}`}
                            value={acc.role}
                            onChange={(e) =>
                              handleRoleChange(
                                acc.id,
                                e.target.value as UserRole
                              )
                            }
                            className="rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground"
                          >
                            <option value="admin">Administrator</option>
                            <option value="doctor">Doctor</option>
                            <option value="researcher">Researcher</option>
                            <option value="patient">Patient</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            disabled={acc.id === user?.id}
                            onClick={() => handleDeleteUser(acc.id, acc.email)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#C0504D]/35 bg-[#C0504D]/10 px-2.5 py-1.5 text-[12px] font-medium text-[#C0504D] hover:bg-[#C0504D]/20 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>
        )}

        {/* ===================================================================
            SECTION 2: MEDICAL LISTS (4 LISTS: Investigations, Symptoms, Diagnoses, Specialties)
           =================================================================== */}
        {activeSection === "medical_lists" && (
          <motion.section
            {...fadeUp}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left: Add / Edit Form */}
            <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-6">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                {editingItemId ? "Edit List Entry" : "Add List Entry"}
              </span>
              <h2 className="font-serif text-xl font-medium text-foreground mb-4">
                {editingItemId ? "Update Item" : "Add to Medical List"}
              </h2>

              <form onSubmit={handleSaveMedicalItem} className="space-y-3.5">
                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-1">
                    List Category
                  </label>
                  <select
                    value={listCategory}
                    onChange={(e) => {
                      setListCategory(e.target.value as MedicalCategory);
                      setEditingItemId(null);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground"
                  >
                    <option value="symptom">
                      Symptoms &amp; Findings (with Score)
                    </option>
                    <option value="investigation">Investigations</option>
                    <option value="diagnosis">Diagnoses</option>
                    <option value="specialty">Specialties</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-1">
                    Name / Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g., Bilateral hilar lymphadenopathy"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-1">
                    Group / Category Label
                  </label>
                  <input
                    type="text"
                    value={itemGroup}
                    onChange={(e) => setItemGroup(e.target.value)}
                    placeholder="General / Chest / Imaging & tests"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground"
                  />
                </div>

                {listCategory === "symptom" && (
                  <div>
                    <label className="block text-[13px] font-semibold text-foreground mb-1">
                      Score Points (−2 to +5)
                    </label>
                    <input
                      type="number"
                      min={-5}
                      max={10}
                      value={itemPoints}
                      onChange={(e) => setItemPoints(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary-hover"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingItemId ? "Save Changes" : "Add Item"}</span>
                  </button>
                  {editingItemId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItemId(null);
                        setItemName("");
                      }}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] font-medium text-foreground"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right: 4-List Switcher & Table */}
            <div className="lg:col-span-8 rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap gap-2 mb-5">
                {(
                  [
                    { id: "symptom", label: "Symptoms (Name + Score)" },
                    { id: "investigation", label: "Investigations" },
                    { id: "diagnosis", label: "Diagnoses" },
                    { id: "specialty", label: "Specialties" },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setListCategory(cat.id);
                      setEditingItemId(null);
                    }}
                    className={cn(
                      "rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors",
                      listCategory === cat.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-card"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-background">
                <table className="w-full text-left border-collapse text-[14px]">
                  <thead>
                    <tr className="border-b border-border bg-card/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Group</th>
                      {listCategory === "symptom" && (
                        <th className="py-3 px-4 text-right">Points</th>
                      )}
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredListItems.map((item) => (
                      <tr key={item.id} className="hover:bg-card/40">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {item.name}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {item.groupName}
                        </td>
                        {listCategory === "symptom" && (
                          <td className="py-3 px-4 text-right font-mono font-semibold">
                            {(item.points ?? 0) > 0
                              ? `+${item.points}`
                              : item.points ?? 0}
                          </td>
                        )}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditMedicalItem(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-foreground hover:bg-background"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-primary" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteMedicalItem(item.id, item.name)
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-[#C0504D]/35 bg-[#C0504D]/10 px-2.5 py-1 text-[12px] font-medium text-[#C0504D] hover:bg-[#C0504D]/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>
        )}

        {/* ===================================================================
            SECTION 3: SCORING & LAB RANGES
           =================================================================== */}
        {activeSection === "scoring_labs" && (
          <motion.section {...fadeUp} className="space-y-8">
            {/* Normal Ranges & Max Points for Laboratory Tests */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                Laboratory Reference Thresholds
              </span>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
                Normal Ranges &amp; Maximum Points for Laboratory Tests
              </h2>
              <p className="text-[14px] text-muted-foreground mb-5">
                Adjusting a normal range or max points updates live visit
                scoring and logs the change to the audit trail.
              </p>

              <div className="overflow-x-auto rounded-xl border border-border bg-background">
                <table className="w-full text-left border-collapse text-[14px]">
                  <thead>
                    <tr className="border-b border-border bg-card/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">Lab Test</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Direction</th>
                      <th className="py-3 px-4">Normal Low</th>
                      <th className="py-3 px-4">Normal High</th>
                      <th className="py-3 px-4">Max Points</th>
                      <th className="py-3 px-4 text-right">Save</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {labRanges.map((lab) => {
                      const edit = labEdits[lab.id] ?? {
                        low: String(lab.low),
                        high: String(lab.high),
                        max_points: String(lab.max_points),
                      };
                      return (
                        <tr key={lab.id}>
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {lab.label}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {lab.unit}
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded bg-card px-2 py-0.5 text-[12px] font-medium border border-border">
                              {lab.direction === "high"
                                ? "Elevated (> High)"
                                : "Reduced (< Low)"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              step="any"
                              value={edit.low}
                              onChange={(e) =>
                                setLabEdits((prev) => ({
                                  ...prev,
                                  [lab.id]: { ...edit, low: e.target.value },
                                }))
                              }
                              className="w-24 rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-[13px] text-foreground"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              step="any"
                              value={edit.high}
                              onChange={(e) =>
                                setLabEdits((prev) => ({
                                  ...prev,
                                  [lab.id]: { ...edit, high: e.target.value },
                                }))
                              }
                              className="w-24 rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-[13px] text-foreground"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={edit.max_points}
                              onChange={(e) =>
                                setLabEdits((prev) => ({
                                  ...prev,
                                  [lab.id]: {
                                    ...edit,
                                    max_points: e.target.value,
                                  },
                                }))
                              }
                              className="w-20 rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-[13px] text-foreground"
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleSaveLabRange(lab.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary-hover"
                            >
                              <Save className="h-3.5 w-3.5" />
                              <span>Save</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Points per Symptom / Finding */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                Symptom &amp; Finding Weights
              </span>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
                Points Assigned to Each Clinical Finding
              </h2>
              <p className="text-[14px] text-muted-foreground mb-5">
                Set the point contribution of each symptom or examination item.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {medicalLists
                  .filter((m) => m.category === "symptom")
                  .map((sym) => {
                    const val =
                      symptomPointEdits[sym.id] ?? String(sym.points ?? 0);
                    return (
                      <div
                        key={sym.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5"
                      >
                        <div>
                          <p className="text-[14px] font-semibold text-foreground">
                            {sym.name}
                          </p>
                          <span className="text-[12px] text-muted-foreground">
                            Group: {sym.groupName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min={-5}
                            max={10}
                            value={val}
                            onChange={(e) =>
                              setSymptomPointEdits((prev) => ({
                                ...prev,
                                [sym.id]: e.target.value,
                              }))
                            }
                            className="w-16 rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-[13px] text-foreground text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveSymptomPoints(sym)}
                            className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary-hover"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.section>
        )}

        {/* ===================================================================
            SECTION 4: REVIEW CHANGES (LATEST 200 CHANGES: WHO, WHAT, WHEN)
           =================================================================== */}
        {activeSection === "audit_log" && (
          <motion.section
            {...fadeUp}
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                  Audit Trail · Maximum 200 Recent Entries
                </span>
                <h2 className="font-serif text-2xl font-medium text-foreground">
                  Review Changes (Who, What, When)
                </h2>
              </div>
              <span className="text-[13px] text-muted-foreground">
                Showing {auditLogs.length} of latest 200 logged actions
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-background">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead>
                  <tr className="border-b border-border bg-card/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3.5 px-4">When (Timestamp)</th>
                    <th className="py-3.5 px-4">Who (User &amp; Role)</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">What Changed (Target)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs.map((entry) => (
                    <tr key={entry.id} className="hover:bg-card/40">
                      <td className="py-3 px-4 font-mono text-[12px] text-muted-foreground whitespace-nowrap">
                        {entry.at.replace("T", " ").slice(0, 19)} UTC
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-foreground">
                          {entry.userEmail}
                        </span>
                        <span className="ml-2 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                          {entry.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[12px] font-semibold text-primary whitespace-nowrap">
                        {entry.action}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {entry.target}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {/* ===================================================================
            SECTION 5: BACKUP & RESTORE (WITH CONFIRMATION STEP)
           =================================================================== */}
        {activeSection === "backup" && (
          <motion.section
            {...fadeUp}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
          >
            {/* Download Backup */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
                  <Download className="h-5 w-5" />
                </div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                  System Snapshot Export
                </span>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                  Download a Backup File
                </h2>
                <p className="text-[15px] leading-relaxed text-muted-foreground mb-6">
                  Export a complete JSON snapshot of all user accounts, fake
                  patient files, clinical visits, medical lists, lab ranges,
                  imported research cases, and the audit log.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[15px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Backup File (.json)</span>
                </button>

                {!confirmResetOpen ? (
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-card"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Reset to Initial Demo Seed Data</span>
                  </button>
                ) : (
                  <div className="rounded-xl border border-[#E3A21A]/50 bg-[#E3A21A]/10 p-4 space-y-2.5">
                    <p className="text-[13px] font-semibold text-foreground">
                      Confirm Reset: Replace current browser database with the
                      default 10 demo patients and 4 role accounts?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmFactoryReset}
                        className="rounded-lg bg-[#C0504D] px-3.5 py-1.5 text-[12px] font-semibold text-white"
                      >
                        Yes, Reset Now
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResetOpen(false)}
                        className="rounded-lg border border-border bg-background px-3.5 py-1.5 text-[12px] font-medium text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Restore from Backup File (With Confirmation Step) */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
                <Upload className="h-5 w-5" />
              </div>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                System Recovery
              </span>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                Restore from a Backup File
              </h2>
              <p className="text-[15px] leading-relaxed text-muted-foreground mb-5">
                Select a previously downloaded SarcoScore `.json` backup file.
                You will be asked to review and confirm the snapshot before any
                data is overwritten.
              </p>

              <label className="block w-full cursor-pointer rounded-xl border-2 border-dashed border-border bg-background p-5 text-center hover:border-primary/50 transition-colors">
                <span className="block text-[14px] font-semibold text-foreground">
                  Choose Backup JSON File
                </span>
                <span className="mt-1 block text-[12px] text-muted-foreground">
                  Accepts .json files exported from SarcoScore
                </span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleBackupFileSelected}
                  className="sr-only"
                />
              </label>

              {/* Confirmation Step before Restoring */}
              {stagedBackupSummary && (
                <div className="mt-5 rounded-xl border border-[#E3A21A]/50 bg-[#E3A21A]/10 p-5 space-y-4">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-[#9A6B08] mt-0.5" />
                    <div>
                      <h3 className="text-[15px] font-semibold text-foreground">
                        Confirmation Required: Overwrite System State?
                      </h3>
                      <p className="text-[13px] text-foreground/85 mt-1">
                        Backup file verified: contains{" "}
                        <strong>{stagedBackupSummary.usersCount}</strong> users,{" "}
                        <strong>{stagedBackupSummary.patientsCount}</strong>{" "}
                        patient files,{" "}
                        <strong>{stagedBackupSummary.visitsCount}</strong>{" "}
                        visits, and{" "}
                        <strong>{stagedBackupSummary.auditCount}</strong> audit
                        entries.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleConfirmRestore}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirm &amp; Restore Backup</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStagedBackupJson("");
                        setStagedBackupSummary(null);
                      }}
                      className="rounded-lg border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </div>
    </RoleGuard>
  );
}
