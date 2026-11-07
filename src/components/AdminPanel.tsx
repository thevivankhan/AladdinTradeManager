import React, { useState, useEffect, useRef } from "react";
import { AdminTradingRoom } from "./AdminTradingRoom";
import { 
  CheckCircle2, XCircle, Clock, ShieldCheck, User, 
  Users, Key, Search, Shield, Copy, RefreshCw, Wrench,
  Smartphone, Monitor, Trash2, Power, PowerOff, Download, UserPlus,
  Image as ImageIcon, X, Eye, EyeOff, ShieldOff, Activity, Mail,
  Send, MessageCircle, Sparkles, Check, UserCheck, Bell
} from "lucide-react";
import {
  getIssuedLicenses,
  syncLicensesFromServer,
  issueNewLicense,
  renewLicense,
  toggleSuspendLicense,
  deleteLicense,
  generateVipPassText,
  getTelegramShareUrl,
  LicenseKey,
  MASTER_ADMIN_EMAILS,
  resetLicenseDeviceLock,
  StudentApplication,
  getStudentApplications,
  approveStudentApplication,
  rejectStudentApplication,
  deleteStudentApplication,
  getTawkToPropertyId,
  setTawkToPropertyId,
  getTawkToWidgetId,
  setTawkToWidgetId
} from '../lib/licenseEngine';

const logout = () => { 
  try {
    localStorage.removeItem("mock_firebaseUser");
    localStorage.removeItem("mock_dbUser");
    localStorage.removeItem("aladdin_in_app");
    localStorage.removeItem("aladdin_admin_view_mode");
  } catch {}
  window.location.reload(); 
};

export const AdminPanel = ({ 
  onClose, 
  onPreviewLanding, 
  onPreviewPaywall,
  onPreviewLogin 
}: { 
  onClose: () => void; 
  onPreviewLanding: () => void; 
  onPreviewPaywall: () => void;
  onPreviewLogin?: () => void;
}) => {
  const formatTimestamp = (timestamp: any, formatType: 'date' | 'time' | 'datetime' = 'datetime', fallback = 'Unknown') => {
    if (!timestamp?.toDate) return fallback;
    const d = timestamp.toDate();
    if (isNaN(d.getTime())) return fallback;
    if (formatType === 'date') return d.toLocaleDateString();
    if (formatType === 'time') return d.toLocaleTimeString();
    return d.toLocaleString();
  };
  const [activeTab, setActiveTab] = useState<"vault" | "studentApps" | "approvals" | "students" | "admins" | "tools" | "pendingAccounts" | "allUsers" | "logs" | "tradingRoom">("studentApps");
  const [vaultLicenses, setVaultLicenses] = useState<LicenseKey[]>([]);
  const [studentApps, setStudentApps] = useState<StudentApplication[]>([]);
  const [newTraderName, setNewTraderName] = useState("");
  const [newTraderPhone, setNewTraderPhone] = useState("");
  const [newTraderPlan, setNewTraderPlan] = useState<LicenseKey['plan']>("1 Month ($47)");
  const [lastIssuedLicense, setLastIssuedLicense] = useState<LicenseKey | null>(null);
  const [vaultSearchQuery, setVaultSearchQuery] = useState("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Tawk.to settings state
  const [tawkPropInput, setTawkPropInput] = useState("");
  const [tawkWidgetInput, setTawkWidgetInput] = useState("default");
  const [tawkSavedMsg, setTawkSavedMsg] = useState("");

  // Pocket Option Trader IDs Whitelist State
  const [verifiedTraderIds, setVerifiedTraderIds] = useState<string[]>([]);
  const [newTraderIdInput, setNewTraderIdInput] = useState("");
  const [isUpdatingTraderIds, setIsUpdatingTraderIds] = useState(false);

  // Live student signup alert state
  const [newSignupAlert, setNewSignupAlert] = useState<{ name: string; contact: string; deviceName?: string } | null>(null);
  const prevPendingCountRef = useRef<number | null>(null);
  const isInitialPollRef = useRef(true);

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      // High-end dual bell chime (E5 -> B5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.15);
      gain2.gain.setValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.debug('Notification chime fallback', e);
    }
  };

  const refreshStudentApps = () => {
    setStudentApps(getStudentApplications());
    fetch('/api/student-applications')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.applications)) {
          setStudentApps(data.applications);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    setVaultLicenses(getIssuedLicenses());
    syncLicensesFromServer().then((lics) => {
      if (lics && lics.length > 0) setVaultLicenses(lics);
    });
    refreshStudentApps();
    setTawkPropInput(getTawkToPropertyId());
    setTawkWidgetInput(getTawkToWidgetId());

    fetch('/api/admin/trader-ids')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.verifiedTraderIds) {
          setVerifiedTraderIds(data.verifiedTraderIds);
        }
      })
      .catch(() => {});

    // Polling every 3.5 seconds for instant notification of new student applications
    const pollInterval = setInterval(() => {
      fetch('/api/student-applications/status')
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.pendingCount === 'number') {
            if (isInitialPollRef.current) {
              prevPendingCountRef.current = data.pendingCount;
              isInitialPollRef.current = false;
            } else if (prevPendingCountRef.current !== null && data.pendingCount > prevPendingCountRef.current) {
              // 🔔 NEW REGISTRATION RECEIVED! Trigger notification bell and alert banner
              playNotificationSound();
              if (data.latestApplicant) {
                setNewSignupAlert({
                  name: data.latestApplicant.name || 'New Student',
                  contact: data.latestApplicant.contact || '',
                  deviceName: data.latestApplicant.deviceName || data.latestApplicant.deviceId,
                });
              }
              refreshStudentApps();
              prevPendingCountRef.current = data.pendingCount;
            } else {
              prevPendingCountRef.current = data.pendingCount;
            }
          }
        })
        .catch(() => {});
    }, 3500);

    return () => clearInterval(pollInterval);
  }, []);

  const handleAddTraderId = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTraderIdInput.trim();
    if (!clean) return;
    setIsUpdatingTraderIds(true);
    try {
      const res = await fetch('/api/admin/trader-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', id: clean }),
      });
      const data = await res.json();
      if (data && data.verifiedTraderIds) {
        setVerifiedTraderIds(data.verifiedTraderIds);
        setNewTraderIdInput('');
      }
    } catch {}
    setIsUpdatingTraderIds(false);
  };

  const handleRemoveTraderId = async (idToRemove: string) => {
    setIsUpdatingTraderIds(true);
    try {
      const res = await fetch('/api/admin/trader-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', id: idToRemove }),
      });
      const data = await res.json();
      if (data && data.verifiedTraderIds) {
        setVerifiedTraderIds(data.verifiedTraderIds);
      }
    } catch {}
    setIsUpdatingTraderIds(false);
  };

  const filteredVaultLicenses = vaultLicenses.filter((lic) => {
    if (!vaultSearchQuery) return true;
    const q = vaultSearchQuery.toLowerCase();
    return (
      lic.traderName.toLowerCase().includes(q) ||
      lic.key.toLowerCase().includes(q) ||
      lic.cleanKey.toLowerCase().includes(q) ||
      (lic.traderPhone && lic.traderPhone.toLowerCase().includes(q)) ||
      lic.plan.toLowerCase().includes(q)
    );
  });

  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminRole, setAdminRole] = useState("admin");
  const [adminNotes, setAdminNotes] = useState("");
  const [adminExpiration, setAdminExpiration] = useState("");

  // Password Generator State
  const [passwordLength, setPasswordLength] = useState(12);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<"Weak" | "Medium" | "Strong">("Weak");
  const [bulkCount, setBulkCount] = useState(1);
  const [passwordHistory, setPasswordHistory] = useState<string[]>([]);
  const [generatedPassword, setGeneratedPassword] = useState("");

  // Add User State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserDuration, setNewUserDuration] = useState("lifetime");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState("");

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "confirm" | "alert";
    onConfirm?: () => void;
  }>({ isOpen: false, title: "", message: "", type: "alert" });

  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editNewPassword, setEditNewPassword] = useState("");

  useEffect(() => {
    import('../lib/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ collection, onSnapshot }) => {
        const unsubscribeUsers = onSnapshot(
          collection(db, 'users'),
          (snap) => {
            setUsers(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          },
          (err) => {
            console.warn("Firestore users listener note:", err.message);
          }
        );
        const unsubscribePayments = onSnapshot(
          collection(db, 'payments'),
          (snap) => {
            setPayments(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
          },
          (err) => {
            console.warn("Firestore payments listener note:", err.message);
            setIsLoading(false);
          }
        );
        return () => {
          unsubscribeUsers();
          unsubscribePayments();
        };
      });
    });
  }, []);

  const updateUser = async (userId: string, data: any) => {
    const { db } = await import('../lib/firebase');
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'users', userId), data);
  };

  const updatePayment = async (paymentId: string, data: any) => {
    const { db } = await import('../lib/firebase');
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'payments', paymentId), data);
  };

  const handleAutoGeneratePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserPassword(password);
    setShowNewUserPassword(true);
  };
  
  const handleAutoGenerateEditPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditNewPassword(password);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    setAddUserError("");
    try {
      const newUid = "user_" + Date.now();
      const now = new Date();
      let endDate = new Date(now);
      let isLifetime = false;

      switch (newUserDuration) {
        case "3_days": endDate.setDate(now.getDate() + 3); break;
        case "7_days": endDate.setDate(now.getDate() + 7); break;
        case "30_days": endDate.setDate(now.getDate() + 30); break;
        case "3_months": endDate.setMonth(now.getMonth() + 3); break;
        case "6_months": endDate.setMonth(now.getMonth() + 6); break;
        case "12_months": endDate.setFullYear(now.getFullYear() + 1); break;
        case "lifetime": isLifetime = true; break;
        default: endDate.setDate(now.getDate() + 7); break;
      }
      
      const newUserDoc = {
        id: newUid,
        email: newUserEmail,
        name: newUserName || null,
        phone: newUserPhone || null,
        role: "user",
        isLifetimePaid: isLifetime,
        hasPendingPayment: false,
        status: "active",
        createdAt: now.toISOString(),
        subscriptionStartDate: now.toISOString(),
        subscriptionEndDate: isLifetime ? null : endDate.toISOString(),
        adminCreatedPassword: newUserPassword,
      };

      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', newUserDoc.id), newUserDoc);

      setIsAddUserModalOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserPhone("");
      setNewUserDuration("lifetime");
      setShowNewUserPassword(false);
      showAlert("Success", "User created successfully! They can now log in with the email and password you provided.");
    } catch (error: any) {
      setAddUserError(error.message || "Failed to add user.");
    } finally {
      setIsAddingUser(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    setModalConfig({ isOpen: true, title, message, type: "alert" });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "confirm",
      onConfirm,
    });
  };

  // --- Payment Handlers ---
  const executeApprove = async (paymentId: string, userId: string) => {
    updatePayment(paymentId, { status: "approved" });
    updateUser(userId, {
      isLifetimePaid: true,
      hasPendingPayment: false,
      status: "active"
    });
    showAlert("Success", "Payment approved successfully!");
  };

  const handleApprove = (paymentId: string, userId: string) => {
    showConfirm(
      "Approve Payment",
      "Are you sure you want to approve this payment? This will grant full access.",
      () => executeApprove(paymentId, userId),
    );
  };

  const executeReject = async (paymentId: string, userId: string) => {
    updatePayment(paymentId, { status: "rejected" });
    updateUser(userId, { hasPendingPayment: false });
    showAlert("Success", "Payment rejected.");
  };

  const handleReject = (paymentId: string, userId: string) => {
    showConfirm(
      "Reject Payment",
      "Are you sure you want to reject this payment?",
      () => executeReject(paymentId, userId),
    );
  };

  // --- Advanced User Management Handlers ---
  const handleApproveAccount = async (userId: string) => {
    showConfirm("Approve Account", "Are you sure you want to approve this account? They will now be able to log in and see the paywall.", async () => {
      updateUser(userId, { status: "active" });
      showAlert("Success", "Account approved successfully.");
    });
  };

  const handleActivate = async (userId: string) => {
    showConfirm("Grant Full Access", "Are you sure you want to grant full access to this user?", async () => {
      updateUser(userId, { 
        isLifetimePaid: true, 
        status: "active", 
        hasPendingPayment: false,
        subscriptionStartDate: new Date().toISOString()
      });
      showAlert("Success", "User granted full access successfully.");
    });
  };



  const setSubscriptionPreset = (days: number) => {
    if (!editingUser) return;
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    setEditingUser({
      ...editingUser,
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate: endDate.toISOString(),
      isLifetimePaid: false
    });
  };

  const handleSuspend = async (userId: string) => {
    showConfirm("Suspend User", "Are you sure you want to suspend this user? They will lose access immediately.", async () => {
      updateUser(userId, { isLifetimePaid: false, status: "suspended" });
      showAlert("Success", "User suspended successfully.");
    });
  };

  const handleResetDevice = async (userId: string) => {
    showConfirm("Reset Device", "Are you sure you want to reset the device lock for this user?", async () => {
      updateUser(userId, { deviceId: null, deviceInfo: "Reset by Admin", activeDevices: [] });
      showAlert("Success", "Device reset successfully.");
    });
  };

  const handleResetAllDevices = async () => {
    showConfirm(
      "Reset ALL Devices",
      "Are you absolutely sure you want to reset device locks for ALL users? This will force everyone to log in again.",
      async () => {
        setIsLoading(true);
        const { writeBatch, doc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        const batch = writeBatch(db);
        users.forEach(u => {
          batch.update(doc(db, 'users', u.id), { 
             activeDevices: [],
             deviceId: null,
             deviceInfo: null
          });
        });
        await batch.commit();
        showAlert("Success", "All device locks have been reset successfully.");
        setIsLoading(false);
      }
    );
  };

  const handleSendPasswordReset = async (email: string) => {
    showAlert("Success", `Mock Password reset email sent to ${email}`);
  };

  const handleDeleteUser = async (userId: string) => {
    showConfirm("Delete User", "WARNING: This will permanently delete the user's data from the database. Are you sure?", async () => {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      await deleteDoc(doc(db, 'users', userId));
      showAlert("Success", "User deleted successfully.");
    });
  };

  const toggleAdminRole = async (userId: string, currentRole: string) => {
    const isCurrentlyAdmin = currentRole === "admin";
    const action = isCurrentlyAdmin ? "revoke admin rights from" : "grant admin rights to";
    showConfirm(
      `${isCurrentlyAdmin ? "Revoke" : "Grant"} Admin`,
      `Are you sure you want to ${action} this user?`,
      async () => {
        updateUser(userId, { role: isCurrentlyAdmin ? "user" : "admin" });
        showAlert("Success", `Admin rights updated successfully.`);
      }
    );
  };

  const handleIssueLicense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newTraderName.trim() || "VIP Trader";
    const phone = newTraderPhone.trim() || undefined;
    const newLic = issueNewLicense(name, newTraderPlan, phone);
    setVaultLicenses(getIssuedLicenses());
    setLastIssuedLicense(newLic);
    setNewTraderName("");
    setNewTraderPhone("");
    showAlert("License Generated!", `Crypto Key ${newLic.key} created for ${newLic.traderName}. You can share the VIP pass directly.`);
  };

  const handleRenewVaultKey = (lic: LicenseKey, days: number = 30) => {
    showConfirm(
      "Renew VIP License",
      `Extend license ${lic.key} for ${lic.traderName} by ${days} days?`,
      () => {
        renewLicense(lic.id, days);
        setVaultLicenses(getIssuedLicenses());
        showAlert("Renewed", `License ${lic.key} successfully extended by ${days} days.`);
      }
    );
  };

  const handleToggleSuspendVaultKey = (lic: LicenseKey) => {
    const isSuspending = lic.status !== "suspended";
    showConfirm(
      isSuspending ? "Kill-Switch (Suspend Access)" : "Reactivate Access",
      isSuspending
        ? `Are you sure you want to SUSPEND ${lic.traderName} (${lic.key})? They will immediately lose access.`
        : `Reactivate access for ${lic.traderName} (${lic.key})?`,
      () => {
        toggleSuspendLicense(lic.id);
        setVaultLicenses(getIssuedLicenses());
        showAlert(
          isSuspending ? "Access Denied" : "Access Restored",
          `License ${lic.key} is now ${isSuspending ? "SUSPENDED" : "ACTIVE"}.`
        );
      }
    );
  };

  const handleDeleteVaultKey = (lic: LicenseKey) => {
    showConfirm(
      "Delete License",
      `Are you sure you want to permanently delete license ${lic.key} for ${lic.traderName}? This cannot be undone.`,
      () => {
        deleteLicense(lic.id);
        setVaultLicenses(getIssuedLicenses());
        if (lastIssuedLicense?.id === lic.id) setLastIssuedLicense(null);
        showAlert("Deleted", `License ${lic.key} removed from system.`);
      }
    );
  };

  const handleResetDeviceLock = (lic: LicenseKey) => {
    showConfirm(
      "Reset Device Lock",
      `Unlock hardware device binding for ${lic.traderName} (${lic.key})? They will be allowed to link a new phone on their next login.`,
      () => {
        resetLicenseDeviceLock(lic.id);
        setVaultLicenses(getIssuedLicenses());
        showAlert("Device Lock Reset", `Device binding cleared for ${lic.traderName}. They can now login from their new device.`);
      }
    );
  };

  const handleCopyPass = (lic: LicenseKey) => {
    const text = generateVipPassText(lic);
    navigator.clipboard.writeText(text);
    setCopiedKeyId(lic.id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handlePromoteToAdmin = async () => {
    const email = newAdminEmail.toLowerCase().trim();
    if (!email) {
      showAlert("Error", "Please enter an email address.");
      return;
    }
    
    const userToPromote = users.find(u => u.email?.toLowerCase() === email);
    
    if (userToPromote) {
      if (userToPromote.role === "admin") {
        showAlert("Info", "This user is already an admin.");
        return;
      }
      showConfirm("Promote to Admin", `Are you sure you want to make ${userToPromote.email} an admin?`, async () => {
        let expirationDate = null;
        if (adminExpiration) {
          expirationDate = new Date(adminExpiration);
          if (isNaN(expirationDate.getTime())) {
            expirationDate = null;
          }
        }
        const updateData: any = { 
          role: adminRole, 
          isLifetimePaid: true, 
          status: "active",
          adminNotes: adminNotes,
          adminExpiration: expirationDate ? expirationDate.toISOString() : null
        };
        updateUser(userToPromote.id, updateData);
        showAlert("Success", `${userToPromote.email} is now an admin.`);
        setNewAdminEmail("");
        setAdminNotes("");
        setAdminExpiration("");
      });
    } else {
      // Pre-authorize new email
      showConfirm(
        "Pre-authorize Admin", 
        `User with email ${email} not found in mock mode. Skipping pre-authorization.`, 
        async () => {
          setNewAdminEmail("");
        }
      );
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const { id, ...data } = editingUser;
      
      if (editNewPassword.trim() !== "") {
        data.adminCreatedPassword = editNewPassword.trim();
      }
      
      updateUser(id, data);
      showAlert("Success", "User updated successfully.");
      setEditingUser(null);
      setEditNewPassword("");
    } catch (error) {
      showAlert("Error", "Failed to update user.");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Email", "Role", "Status", "Paid", "Device Info", "Last Login", "Created At"];
    const rows = users.map(u => [
      u.email || "Unknown",
      u.role || "user",
      u.status || "active",
      u.isLifetimePaid ? "Yes" : "No",
      u.deviceInfo || "Unknown",
      u.lastLogin?.toDate ? formatTimestamp(u.lastLogin, 'datetime', 'Never') : (u.createdAt?.toDate ? formatTimestamp(u.createdAt, 'datetime', 'Never') : "Never"),
      u.createdAt?.toDate ? formatTimestamp(u.createdAt, 'datetime', 'Unknown') : "Unknown"
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trade_manager_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Password Generator ---
  const generatePassword = (preset?: string) => {
    let length = passwordLength;
    let incUpper = includeUppercase;
    let incNum = includeNumbers;
    let incSym = includeSymbols;
    
    if (preset === 'pin') {
      length = 4;
      incUpper = false;
      incNum = true;
      incSym = false;
    } else if (preset === 'high') {
      length = 20;
      incUpper = true;
      incNum = true;
      incSym = true;
    } else if (preset === 'easy') {
      length = 12;
      incUpper = true;
      incNum = true;
      incSym = false;
    }

    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    const ambiguous = "l1IO0";

    let chars = lowercase;
    if (incUpper) chars += uppercase;
    if (incNum) chars += numbers;
    if (incSym) chars += symbols;

    if (excludeAmbiguous) {
      chars = chars.split('').filter(c => !ambiguous.includes(c)).join('');
    }

    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setGeneratedPassword(password);
    
    // Update History
    setPasswordHistory(prev => [password, ...prev].slice(0, 5));
    
    // Strength
    if (length < 8) setPasswordStrength("Weak");
    else if (length < 16) setPasswordStrength("Medium");
    else setPasswordStrength("Strong");
  };

  const copyToClipboard = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    showAlert("Copied", "Password copied to clipboard!");
  };

  // --- Filtering & Sorting ---
  const allUsersFiltered = users
    .filter(u => {
      const search = searchQuery.toLowerCase();
      const emailMatch = u.email?.toLowerCase().includes(search);
      const phoneMatch = u.phone?.toLowerCase().includes(search);
      const nameMatch = u.name?.toLowerCase().includes(search);
      return !searchQuery || emailMatch || phoneMatch || nameMatch;
    })
    .sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });

  const filteredUsers = users
    .filter(u => {
      const search = searchQuery.toLowerCase();
      const emailMatch = u.email?.toLowerCase().includes(search);
      const phoneMatch = u.phone?.toLowerCase().includes(search);
      const nameMatch = u.name?.toLowerCase().includes(search);
      return (!searchQuery || emailMatch || phoneMatch || nameMatch);
    })
    .sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });
    
  const pendingAccountsUsers = users
    .filter(u => {
      const search = searchQuery.toLowerCase();
      const emailMatch = u.email?.toLowerCase().includes(search);
      const phoneMatch = u.phone?.toLowerCase().includes(search);
      const nameMatch = u.name?.toLowerCase().includes(search);
      return u.status === "pending" && (!searchQuery || emailMatch || phoneMatch || nameMatch);
    })
    .sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });

  const adminUsers = users.filter(u => u.role === "admin");

  // --- Stats ---
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isLifetimePaid && u.status !== "suspended").length;
  const suspendedUsers = users.filter(u => u.status === "suspended").length;
  const pendingPayments = payments.filter(p => p.status === "pending");
  const pendingPaymentsCount = pendingPayments.length;
  const pendingAccountsCount = users.filter(u => u.status === "pending").length;
  const onlineUsersCount = users.filter(u => u.isOnline).length;
  const totalDevicesCount = users.reduce((acc, u) => acc + (u.activeDevices?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-slate-300 relative">
      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedScreenshot(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end p-2">
              <button 
                onClick={() => setSelectedScreenshot(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto rounded-xl border border-slate-700 bg-slate-900">
              <img src={selectedScreenshot} alt="Payment Screenshot" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">
              {modalConfig.title}
            </h3>
            <p className="text-slate-400 mb-6">{modalConfig.message}</p>
            <div className="flex justify-end gap-3">
              {modalConfig.type === "confirm" && (
                <button
                  onClick={() =>
                    setModalConfig({ ...modalConfig, isOpen: false })
                  }
                  className="px-4 py-2 rounded-lg font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  setModalConfig({ ...modalConfig, isOpen: false });
                  if (modalConfig.type === "confirm" && modalConfig.onConfirm) {
                    modalConfig.onConfirm();
                  }
                }}
                className="px-4 py-2 rounded-lg font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
              >
                {modalConfig.type === "confirm" ? "Confirm" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-emerald-400" /> Edit User Details
                </h3>
                <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.name || ""}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingUser.email || ""}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingUser.phone || ""}
                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                    <select
                      value={editingUser.role || "user"}
                      onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="user">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                    <select
                      value={editingUser.status || "active"}
                      onChange={e => setEditingUser({ ...editingUser, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase">Subscription Dates</label>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setSubscriptionPreset(7)} className="text-[9px] bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 transition-colors">7D</button>
                      <button type="button" onClick={() => setSubscriptionPreset(30)} className="text-[9px] bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 transition-colors">1M</button>
                      <button type="button" onClick={() => setSubscriptionPreset(365)} className="text-[9px] bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 transition-colors">1Y</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={(() => {
                          const d = new Date(editingUser.subscriptionStartDate);
                          return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
                        })()}
                        onChange={e => {
                          const d = new Date(e.target.value);
                          if (!isNaN(d.getTime())) {
                            setEditingUser({ ...editingUser, subscriptionStartDate: d.toISOString() });
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">End Date</label>
                      <input
                        type="date"
                        disabled={editingUser.isLifetimePaid}
                        value={(() => {
                          if (!editingUser.subscriptionEndDate) return "";
                          const d = new Date(editingUser.subscriptionEndDate);
                          return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
                        })()}
                        onChange={e => {
                          const d = new Date(e.target.value);
                          if (!isNaN(d.getTime())) {
                            setEditingUser({ ...editingUser, subscriptionEndDate: d.toISOString() });
                          }
                        }}
                        className={`w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none ${editingUser.isLifetimePaid ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Device Limit</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editingUser.deviceLimit || 3}
                      onChange={e => setEditingUser({ ...editingUser, deviceLimit: parseInt(e.target.value) || 3 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setEditingUser({ ...editingUser, activeDevices: [], deviceId: null })}
                      className="w-full px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg font-bold text-xs transition-colors border border-rose-500/20"
                    >
                      Reset All Devices
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingUser({ ...editingUser, isLifetimePaid: !editingUser.isLifetimePaid })}
                    className={`w-10 h-6 rounded-full transition-colors relative ${editingUser.isLifetimePaid ? "bg-emerald-500" : "bg-slate-800"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingUser.isLifetimePaid ? "left-5" : "left-1"}`} />
                  </button>
                  <span className="text-sm font-bold text-slate-300">Lifetime Paid Access</span>
                </div>

                {editingUser.activeDevices && editingUser.activeDevices.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Active Devices ({editingUser.activeDevices.length})</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                      {editingUser.activeDevices.map((device: any, idx: number) => (
                        <div key={idx} className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Smartphone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-[10px] text-slate-300 truncate">{device.deviceInfo}</p>
                              <p className="text-[8px] text-slate-500 font-mono truncate">{device.deviceId}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[8px] text-slate-500 uppercase">Last Seen</p>
                            <p className="text-[9px] text-emerald-500">
                              {(() => {
                                const d = new Date(device.lastSeen);
                                return isNaN(d.getTime()) ? "Unknown" : d.toLocaleDateString();
                              })()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Password Management Section */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" /> Password Management
                  </h4>
                  
                  {editingUser.adminCreatedPassword && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Admin-Set Password</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={editingUser.adminCreatedPassword}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none font-mono text-sm"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        This is the password you created for this user. If they changed it themselves, this might be outdated.
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-emerald-500 uppercase">Generate New Password</label>
                      <button
                        type="button"
                        onClick={handleAutoGenerateEditPassword}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Auto Generate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type a new password here..."
                        value={editNewPassword}
                        onChange={(e) => setEditNewPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg pl-4 pr-10 py-2 text-white focus:border-emerald-500 outline-none font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editNewPassword) navigator.clipboard.writeText(editNewPassword);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Copy Password"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-emerald-500/70 mt-1">
                      Typing a new password here and clicking "Save Changes" will save this password and automatically send a reset link to the user.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleSendPasswordReset(editingUser.email)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <Mail className="w-4 h-4" />
                      Send Password Reset Link to User
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-900 p-6 rounded-2xl border border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" /> Advanced Admin Panel
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time user management, device tracking, and system control
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 w-full md:w-auto">
            {onPreviewLogin && (
              <button
                onClick={onPreviewLogin}
                className="flex-1 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors text-[11px] font-bold border border-amber-500/20 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" /> Preview Sign-Up
              </button>
            )}
            <button
              onClick={onPreviewLanding}
              className="flex-1 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors text-[11px] font-bold border border-emerald-500/20 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Landing Page
            </button>
            <button
              onClick={onPreviewPaywall}
              className="flex-1 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 rounded-lg transition-colors text-[11px] font-bold border border-cyan-500/20 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Paywall
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors text-[11px] font-bold border border-blue-500/20 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" /> Trade Manager
            </button>
            <button
              onClick={() => logout()}
              className="flex-1 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors text-[11px] font-bold border border-rose-500/20 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Logout"
            >
              <PowerOff className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>

        {/* Live Incoming Signup Alert Banner */}
        {newSignupAlert && (
          <div className="p-4 bg-gradient-to-r from-cyan-950/90 via-slate-900/90 to-emerald-950/90 border border-cyan-400/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_25px_rgba(6,182,212,0.35)] animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="text-sm font-black text-white flex items-center gap-2 flex-wrap">
                  <span>🔔 New Student Registration Received!</span>
                  <span className="text-[10px] bg-cyan-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase tracking-wider">Live Notification</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  <strong className="text-cyan-300 font-bold">{newSignupAlert.name}</strong>
                  {newSignupAlert.contact ? ` (${newSignupAlert.contact})` : ''} just submitted registration from{' '}
                  <strong className="text-white">{newSignupAlert.deviceName || 'Student Device'}</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  setActiveTab('studentApps');
                  setNewSignupAlert(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 text-xs font-black rounded-lg transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Review & Issue Key</span>
              </button>
              <button
                onClick={() => setNewSignupAlert(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-black text-white">{totalUsers}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Eye className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Online Now</p>
              <p className="text-2xl font-black text-white">{onlineUsersCount}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Devices</p>
              <p className="text-2xl font-black text-white">{totalDevicesCount}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pending Accounts</p>
              <p className="text-2xl font-black text-white">{pendingAccountsCount}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pending Payments</p>
              <p className="text-2xl font-black text-white">{pendingPaymentsCount}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Suspended</p>
              <p className="text-2xl font-black text-white">{suspendedUsers}</p>
            </div>
          </div>
          <div 
            onClick={() => setActiveTab("vault")}
            className="bg-slate-900 border border-amber-500/40 hover:border-amber-400 cursor-pointer rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-slate-800/60"
          >
            <div className="w-12 h-12 bg-amber-500/15 rounded-full flex items-center justify-center border border-amber-500/30">
              <Key className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> VIP Crypto Vault
              </p>
              <p className="text-2xl font-black text-white">{vaultLicenses.length} <span className="text-xs text-slate-400 font-normal">Active Keys</span></p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab("studentApps")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all shadow-md ${
              activeTab === "studentApps"
                ? "bg-cyan-400 text-slate-950 font-black shadow-cyan-500/20"
                : "bg-slate-900 text-cyan-400 hover:bg-slate-800 hover:text-cyan-300 border border-cyan-500/30"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> 📝 Student Applications
            {studentApps.filter(a => a.status === 'pending').length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 animate-pulse">
                {studentApps.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("vault")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all shadow-md ${
              activeTab === "vault"
                ? "bg-amber-400 text-slate-950 font-black shadow-amber-500/20"
                : "bg-slate-900 text-amber-400 hover:bg-slate-800 hover:text-amber-300 border border-amber-500/30"
            }`}
          >
            <Key className="w-3.5 h-3.5" /> 🔐 VIP License Vault ({vaultLicenses.length})
          </button>
          <button
            onClick={() => setActiveTab("allUsers")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
              activeTab === "allUsers"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> All Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("pendingAccounts")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
              activeTab === "pendingAccounts"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Pending Accounts
            {pendingAccountsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {pendingAccountsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
              activeTab === "approvals"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Pending Payments
            {pendingPaymentsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {pendingPaymentsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
              activeTab === "students"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Students Database
          </button>
          <button
            onClick={() => setActiveTab("admins")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
              activeTab === "admins"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Admins
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
              activeTab === "logs"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Logs
          </button>
          <button
            onClick={() => setActiveTab("tradingRoom")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
              activeTab === "tradingRoom"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            Trading Room
          </button>
          
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
              activeTab === "tools"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Tools
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          
          {/* TAB: STUDENT APPLICATIONS */}
          {activeTab === "studentApps" && (
            <div className="p-4 sm:p-6 space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-cyan-500/15 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-black text-[10px] tracking-wider uppercase">
                      STUDENT ACCESS QUEUE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                      LIVE SIGN-UP DESK
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-cyan-400" /> Incoming Student Applications
                  </h2>
                  <p className="text-xs text-slate-400 max-w-xl">
                    Review students who registered on the login portal. Verify application details and issue a non-repeating cryptographic key (ATM-XXXXXXX) with 1 click.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Pending Review</p>
                    <p className="text-xl font-black text-cyan-400">
                      {studentApps.filter(a => a.status === 'pending').length} Requests
                    </p>
                  </div>
                  <button
                    onClick={refreshStudentApps}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Refresh List"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Applications List */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" /> All Registrations ({studentApps.length})
                  </h3>
                  <span className="text-xs text-slate-400">
                    Total: {studentApps.length} | Pending: {studentApps.filter(a => a.status === 'pending').length}
                  </span>
                </div>

                {studentApps.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No student applications yet. When a new user registers on the Sign-Up tab, their request will appear here.
                  </div>
                ) : (
                  <div className="space-y-3 pb-24">
                    {studentApps.map((app) => {
                      const isPending = app.status === 'pending';
                      const isApproved = app.status === 'approved';

                      return (
                        <div
                          key={app.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isPending
                              ? "bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-950/20"
                              : isApproved
                              ? "bg-slate-950/70 border-emerald-500/25 opacity-90"
                              : "bg-slate-950/40 border-slate-800 opacity-60"
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            {/* Applicant Info */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-sm">
                                  {app.name}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    isPending
                                      ? "bg-amber-400/20 text-amber-300 border border-amber-400/30 animate-pulse"
                                      : isApproved
                                      ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                                      : "bg-rose-400/20 text-rose-300 border border-rose-400/30"
                                  }`}
                                >
                                  {app.status}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {new Date(app.submittedAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                                {app.email && (
                                  <span className="flex items-center gap-1 text-slate-300">
                                    ✉️ Email: <strong className="text-white font-mono">{app.email}</strong>
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-slate-300">
                                  📱 Phone: <strong className="text-white font-mono">{app.contact}</strong>
                                </span>
                                <span className="flex items-center gap-1 text-cyan-300">
                                  🆔 Pocket Option UID: <strong className="text-cyan-200 font-mono">{app.traderId || "None (Direct Member)"}</strong>
                                </span>
                                <span className="flex items-center gap-1 text-slate-300 text-xs">
                                  💻 Device: <strong className="text-cyan-300 font-semibold">{app.deviceName || app.deviceId}</strong>
                                </span>
                              </div>

                              {isApproved && app.issuedKey && (
                                <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs">
                                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-slate-300">Issued Key:</span>
                                  <strong className="text-emerald-300 font-mono text-sm tracking-wider">
                                    {app.issuedKey}
                                  </strong>
                                  <span className="text-[10px] text-slate-400 font-medium">({app.plan})</span>
                                </div>
                              )}
                            </div>

                            {/* Responsive Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full lg:w-auto">
                              {isPending && (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                                  <select
                                    id={`plan-${app.id}`}
                                    defaultValue="1 Month ($47)"
                                    className="bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 w-full sm:w-auto"
                                  >
                                    <option value="1 Month ($47)">1 Month ($47)</option>
                                    <option value="3 Months ($97)">3 Months ($97)</option>
                                    <option value="6 Months ($147)">6 Months ($147)</option>
                                    <option value="1 Year ($197)">1 Year ($197)</option>
                                    <option value="Lifetime VIP ($297)">Lifetime VIP ($297)</option>
                                  </select>

                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button
                                      onClick={() => {
                                        const select = document.getElementById(`plan-${app.id}`) as HTMLSelectElement;
                                        const chosenPlan = (select?.value || "1 Month ($47)") as LicenseKey['plan'];
                                        const result = approveStudentApplication(app.id, chosenPlan);
                                        if (result) {
                                          fetch('/api/licenses', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(result.license),
                                          }).catch(() => {});
                                          refreshStudentApps();
                                          setVaultLicenses(getIssuedLicenses());
                                          const text = generateVipPassText(result.license);
                                          try { navigator.clipboard.writeText(text); } catch {}
                                          setModalConfig({
                                            isOpen: true,
                                            title: '✅ Application Approved!',
                                            message: `Key "${result.license.key}" has been issued to ${app.name}. VIP Access Pass copied to clipboard!`,
                                            type: 'alert'
                                          });
                                        }
                                      }}
                                      className="flex-1 sm:flex-initial bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                                    >
                                      <Check className="w-4 h-4 stroke-[3]" />
                                      <span>Approve & Issue Key</span>
                                    </button>

                                    {app.contact && (
                                      <a
                                        href={
                                          app.contact.startsWith('@')
                                            ? `https://t.me/${app.contact.replace('@', '')}`
                                            : `https://t.me/share/url?url=https://aladdin.org.in&text=${encodeURIComponent(`Hi ${app.name}, your Aladdin Trade Manager application has been received!`)}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 transition-all cursor-pointer active:scale-95"
                                        title="Chat on Telegram"
                                        aria-label="Telegram"
                                      >
                                        <Send className="w-4 h-4" />
                                      </a>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalConfig({
                                          isOpen: true,
                                          title: 'Reject / Remove Registration',
                                          message: `Are you sure you want to remove the registration request for "${app.name}"?`,
                                          type: 'confirm',
                                          onConfirm: () => {
                                            deleteStudentApplication(app.id);
                                            refreshStudentApps();
                                          },
                                        });
                                      }}
                                      className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all cursor-pointer active:scale-95"
                                      title="Reject & Delete Application"
                                      aria-label="Reject"
                                    >
                                      <X className="w-4 h-4 stroke-[2.5]" />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {isApproved && app.issuedKey && (
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() => {
                                      const matchingLic = vaultLicenses.find(l => l.key === app.issuedKey || l.cleanKey === app.issuedKey);
                                      const passText = matchingLic ? generateVipPassText(matchingLic) : (app.issuedKey || '');
                                      try { navigator.clipboard.writeText(passText); } catch {}
                                      setCopiedKeyId(app.id);
                                      setTimeout(() => setCopiedKeyId(null), 2000);
                                    }}
                                    className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                  >
                                    {copiedKeyId === app.id ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Copied VIP Pass!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy Telegram Pass</span>
                                      </>
                                    )}
                                  </button>

                                  <a
                                    href={`https://t.me/share/url?url=https://aladdin.org.in&text=${encodeURIComponent(
                                      (() => {
                                        const matchingLic = vaultLicenses.find(l => l.key === app.issuedKey || l.cleanKey === app.issuedKey);
                                        return matchingLic ? generateVipPassText(matchingLic) : `✨ Your Aladdin Trade Manager Key: ${app.issuedKey} ✨`;
                                      })()
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-10 px-3 shrink-0 flex items-center justify-center gap-1 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-bold text-xs transition-all cursor-pointer active:scale-95"
                                    title="Open Telegram to Send Key"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Telegram</span>
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalConfig({
                                        isOpen: true,
                                        title: 'Remove Record',
                                        message: `Remove this registration card for "${app.name}"? (The issued key in the Crypto Vault will stay safe).`,
                                        type: 'confirm',
                                        onConfirm: () => {
                                          deleteStudentApplication(app.id);
                                          refreshStudentApps();
                                        },
                                      });
                                    }}
                                    className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer active:scale-95"
                                    title="Remove Card"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CRYPTO LICENSE VAULT */}
          {activeTab === "vault" && (
            <div className="p-4 sm:p-6 space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase">
                      PROPRIETARY CRYPTO VAULT
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                      1,000-KEY ROTATING CHAIN ACTIVE
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Key className="w-6 h-6 text-amber-400" /> VIP License Remote Control
                  </h2>
                  <p className="text-xs text-slate-400 max-w-xl">
                    Generate tamper-proof 7-digit access keys for your paid students. Manage subscriptions, grant +30-day extensions, or invoke remote kill switches with 1 click.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Active VIPs</p>
                    <p className="text-xl font-black text-amber-400">{vaultLicenses.filter(l => l.status === 'active').length} Traders</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Master Admin Whitelist Box */}
              <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-white">Master Admin Whitelist:</strong> Only these authorized emails have passwordless Admin Panel access:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MASTER_ADMIN_EMAILS.map((email) => (
                    <span
                      key={email}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold"
                    >
                      {email}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pocket Option Real-Time Authorized Trader IDs Manager */}
              <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2 mb-4">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      Pocket Option Authorized Trader IDs (Real-time Whitelist)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      IDs authorized here pass verification in real-time. Unauthorized IDs show the "Account Not Found / Account Not Registered" alert.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold self-start sm:self-auto">
                    {verifiedTraderIds.length} Verified IDs
                  </span>
                </div>

                {/* Add new ID form */}
                <form onSubmit={handleAddTraderId} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTraderIdInput}
                    onChange={(e) => setNewTraderIdInput(e.target.value)}
                    placeholder="Enter Pocket Option Trader ID (e.g. 467789, 77554333)..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingTraderIds || !newTraderIdInput.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-md shadow-cyan-500/20"
                  >
                    + Authorize ID
                  </button>
                </form>

                {/* Chips of currently verified IDs */}
                <div className="flex flex-wrap gap-2">
                  {verifiedTraderIds.map((id) => (
                    <div
                      key={id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs font-mono"
                    >
                      <span className="font-bold text-white">{id}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTraderId(id)}
                        className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer text-sm font-bold"
                        title="Remove ID"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {verifiedTraderIds.length === 0 && (
                    <p className="text-xs text-slate-500">No authorized Trader IDs yet. Add an ID above.</p>
                  )}
                </div>
              </div>

              {/* Issue New Key & Last Issued Showcase Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Key Issuance Form (7 Cols) */}
                <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Issue New 7-Digit VIP License
                    </h3>
                    <span className="text-[11px] text-slate-500">Auto-generated from circular pool</span>
                  </div>

                  <form onSubmit={handleIssueLicense} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Student / Trader Full Name <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Vikram Sharma"
                        value={newTraderName}
                        onChange={(e) => setNewTraderName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors placeholder:text-slate-600"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          WhatsApp / Phone (Optional)
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={newTraderPhone}
                          onChange={(e) => setNewTraderPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors placeholder:text-slate-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Subscription Plan
                        </label>
                        <select
                          value={newTraderPlan}
                          onChange={(e) => setNewTraderPlan(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                        >
                          <option value="1 Month ($47)">1 Month ($47) — 30 Days</option>
                          <option value="3 Months ($97)">3 Months ($97) — 90 Days</option>
                          <option value="6 Months ($147)">6 Months ($147) — 180 Days</option>
                          <option value="1 Year ($197)">1 Year ($197) — 365 Days</option>
                          <option value="Lifetime VIP ($297)">Lifetime VIP ($297) — Unlimited</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <Key className="w-4 h-4" /> Generate VIP Crypto Key & Pass
                      </button>
                    </div>
                  </form>
                </div>

                {/* Last Issued VIP Pass Showcase (5 Cols) */}
                <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {lastIssuedLicense ? "Latest Generated VIP Pass" : "Ready to Dispatch"}
                      </span>
                      {lastIssuedLicense && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    {lastIssuedLicense ? (
                      <div className="mt-4 space-y-4">
                        <div className="text-center bg-slate-950 border border-amber-500/40 rounded-xl p-4 shadow-inner">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                            7-Digit Alphanumeric Crypto Key
                          </p>
                          <div className="text-3xl font-black font-mono tracking-widest text-amber-300 select-all py-1">
                            {lastIssuedLicense.key}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Assigned to <span className="text-white font-bold">{lastIssuedLicense.traderName}</span>
                          </p>
                        </div>

                        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 text-xs space-y-1.5">
                          <div className="flex justify-between text-slate-400">
                            <span>Plan:</span>
                            <span className="text-white font-bold">{lastIssuedLicense.plan}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Valid Until:</span>
                            <span className="text-emerald-400 font-bold">
                              {lastIssuedLicense.expiresAt
                                ? new Date(lastIssuedLicense.expiresAt).toLocaleDateString()
                                : "Lifetime Unlimited"}
                            </span>
                          </div>
                          {lastIssuedLicense.traderPhone && (
                            <div className="flex justify-between text-slate-400">
                              <span>Phone:</span>
                              <span className="text-white">{lastIssuedLicense.traderPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 text-center text-slate-500 space-y-2">
                        <Key className="w-10 h-10 mx-auto text-slate-700" />
                        <p className="text-xs">Issue a key on the left to see the instant Telegram/WhatsApp dispatch pass here.</p>
                      </div>
                    )}
                  </div>

                  {lastIssuedLicense && (
                    <div className="pt-4 space-y-2">
                      <button
                        onClick={() => handleCopyPass(lastIssuedLicense)}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                      >
                        {copiedKeyId === lastIssuedLicense.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Full Pass!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy VIP Pass Message
                          </>
                        )}
                      </button>

                      <div className="grid grid-cols-1 gap-2">
                        <a
                          href={getTelegramShareUrl(generateVipPassText(lastIssuedLicense))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 bg-[#229ED9] hover:bg-[#1E8BC0] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Send className="w-3.5 h-3.5" /> Send Pass to Member via Telegram
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Licenses Table Header & Search */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" /> Active VIP Licenses Directory ({filteredVaultLicenses.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">Live remote control over all active student licenses</p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search name, phone, or key..."
                      value={vaultSearchQuery}
                      onChange={(e) => setVaultSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Licenses Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-900/30">
                        <th className="p-3.5 font-semibold">Trader Name</th>
                        <th className="p-3.5 font-semibold">Crypto Key</th>
                        <th className="p-3.5 font-semibold">Plan</th>
                        <th className="p-3.5 font-semibold">Expiry Date</th>
                        <th className="p-3.5 font-semibold">Status</th>
                        <th className="p-3.5 font-semibold text-right">Remote Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-xs">
                      {filteredVaultLicenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No VIP licenses found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredVaultLicenses.map((lic) => {
                          const isExpired = lic.expiresAt ? Date.now() > lic.expiresAt : false;
                          const isSuspended = lic.status === 'suspended';

                          return (
                            <tr key={lic.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-3.5">
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    {lic.traderName}
                                  </div>
                                  {lic.traderPhone && (
                                    <div className="text-[11px] text-slate-400">{lic.traderPhone}</div>
                                  )}
                                </div>
                              </td>

                              <td className="p-3.5 font-mono">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 text-xs">
                                    {lic.key}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(lic.key.replace('-', ''));
                                      setCopiedKeyId(lic.id);
                                      setTimeout(() => setCopiedKeyId(null), 1500);
                                    }}
                                    className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                                    title="Copy clean key"
                                  >
                                    {copiedKeyId === lic.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              <td className="p-3.5">
                                <span className="font-medium text-slate-300">{lic.plan}</span>
                              </td>

                              <td className="p-3.5">
                                {lic.expiresAt ? (
                                  <div>
                                    <div className={isExpired ? "text-rose-400 font-bold" : "text-slate-300 font-medium"}>
                                      {new Date(lic.expiresAt).toLocaleDateString()}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {isExpired
                                        ? "Expired"
                                        : `${Math.ceil((lic.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))} days left`}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-amber-400 font-bold text-[11px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                    LIFETIME VIP
                                  </span>
                                )}
                              </td>

                              <td className="p-3.5">
                                <div className="flex flex-col gap-1">
                                  {isSuspended ? (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold text-[10px] border border-rose-500/20 flex items-center gap-1 w-fit">
                                      <ShieldOff className="w-3 h-3" /> SUSPENDED
                                    </span>
                                  ) : isExpired ? (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold text-[10px] border border-amber-500/20 flex items-center gap-1 w-fit">
                                      <Clock className="w-3 h-3" /> EXPIRED
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20 flex items-center gap-1 w-fit">
                                      <CheckCircle2 className="w-3 h-3" /> ACTIVE
                                    </span>
                                  )}

                                  {lic.boundDeviceId ? (
                                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-[9px] border border-cyan-500/20 flex items-center gap-1 w-fit" title={`Device: ${lic.boundDeviceId}`}>
                                      <Smartphone className="w-2.5 h-2.5" /> {lic.boundDeviceName || "1 Device"} (Locked)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-850 text-slate-400 font-mono text-[9px] border border-slate-700 flex items-center gap-1 w-fit">
                                      <Smartphone className="w-2.5 h-2.5" /> No Device Yet
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Reset Device Lock */}
                                  {lic.boundDeviceId && (
                                    <button
                                      onClick={() => handleResetDeviceLock(lic)}
                                      className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[11px] border border-cyan-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Clear hardware device binding so trader can login on new phone"
                                    >
                                      <Smartphone className="w-3 h-3" /> Reset Dev
                                    </button>
                                  )}

                                  {/* +30 Days Renewal */}
                                  <button
                                    onClick={() => handleRenewVaultKey(lic, 30)}
                                    className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 font-bold text-[11px] border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Add 30 Days to License"
                                  >
                                    <RefreshCw className="w-3 h-3" /> +30d
                                  </button>

                                  {/* Kill-Switch (Suspend / Unsuspend) */}
                                  <button
                                    onClick={() => handleToggleSuspendVaultKey(lic)}
                                    className={`px-2 py-1 rounded-lg font-bold text-[11px] border transition-colors flex items-center gap-1 cursor-pointer ${
                                      isSuspended
                                        ? "bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 border-amber-500/30"
                                        : "bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border-rose-500/30"
                                    }`}
                                    title={isSuspended ? "Reactivate Access" : "Remote Kill Switch (Suspend)"}
                                  >
                                    {isSuspended ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                                    {isSuspended ? "Unsuspend" : "Kill Switch"}
                                  </button>

                                  {/* Copy Pass */}
                                  <button
                                    onClick={() => handleCopyPass(lic)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Copy VIP Pass text"
                                  >
                                    {copiedKeyId === lic.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {/* Telegram Direct */}
                                  <a
                                    href={getTelegramShareUrl(generateVipPassText(lic))}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-800/80 text-cyan-400 hover:text-cyan-200 border border-cyan-800/40 transition-colors"
                                    title="Send Pass on Telegram"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </a>

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDeleteVaultKey(lic)}
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Delete Key"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ALL USERS */}
          {activeTab === "allUsers" && (
            <>
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" /> All Registered Users ({users.length})
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search all users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="p-3 font-medium">User</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Subscription</th>
                      <th className="p-3 font-medium">Devices</th>
                      <th className="p-3 font-medium">Joined</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {allUsersFiltered.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-400" />
                              </div>
                              {user.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-white text-sm">
                                  {user.email || user.phone || "No Identifier"}
                                </p>
                                {user.isOnline ? (
                                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Online</span>
                                ) : (
                                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Offline</span>
                                )}
                              </div>
                              <div className="flex flex-col text-[10px] text-slate-500">
                                <span>{user.name || "No Name Set"}</span>
                                {user.phone && user.email && <span className="text-emerald-500/70">{user.phone}</span>}
                                <span className="text-[8px] opacity-30 font-mono">ID: {user.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            user.status === "suspended" ? "bg-rose-500/10 text-rose-400" :
                            user.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                            user.isLifetimePaid ? "bg-emerald-500/10 text-emerald-400" :
                            "bg-slate-800 text-slate-400"
                          }`}>
                            {user.status === "suspended" ? "Suspended" :
                             user.status === "pending" ? "Pending" :
                             user.isLifetimePaid ? "Active" : "Free"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5">
                            {user.isLifetimePaid ? (
                              <span className="text-xs font-bold text-emerald-500">Unlimited Access</span>
                            ) : (
                              <>
                                <span className={`text-xs font-bold ${
                                  user.subscriptionEndDate?.toDate && user.subscriptionEndDate.toDate() < new Date() 
                                    ? "text-rose-500" 
                                    : "text-slate-300"
                                }`}>
                                  {user.subscriptionEndDate?.toDate 
                                    ? formatTimestamp(user.subscriptionEndDate, 'date', 'No Date') 
                                    : "No Date"}
                                </span>
                                {user.subscriptionEndDate?.toDate && (
                                  <span className="text-[10px] text-slate-500">
                                    {Math.ceil((user.subscriptionEndDate.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 0 
                                      ? `${Math.ceil((user.subscriptionEndDate.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                                      : "Expired"}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <Smartphone className="w-4 h-4 text-slate-500" />
                              <span className="font-bold text-emerald-500">{user.activeDevices?.length ?? 0}</span>
                              <span className="text-xs text-slate-500">/ {user.deviceLimit || 3}</span>
                              <span className="text-[10px] text-slate-600 uppercase ml-1">Limit</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <span className="truncate max-w-[120px]">{user.deviceInfo || "Unknown Device"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-400">
                          {formatTimestamp(user.createdAt, 'date', 'Unknown')}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1 px-3"
                            >
                              <Wrench className="w-4 h-4" /> <span className="text-xs font-bold">Manage</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB: APPROVALS */}
          {activeTab === "approvals" && (
            <>
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Pending Approvals
                </h2>
              </div>
              <div className="p-4">
                {isLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading pending payments...</div>
                ) : pendingPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-300 mb-1">All Caught Up!</h3>
                    <p className="text-slate-500 text-sm">No pending payments to review.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{payment.email || payment.userEmail}</p>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-400">
                              <span className="bg-slate-800 px-2 py-1 rounded-md">
                                {payment.method === 'crypto' ? 'Crypto' : 'UPI'}: {payment.transactionId || payment.utrNumber}
                              </span>
                              <span className="bg-slate-800 px-2 py-1 rounded-md">
                                {formatTimestamp(payment.createdAt, 'datetime', 'Recently')}
                              </span>
                            </div>
                            {payment.screenshot && (
                              <button 
                                onClick={() => setSelectedScreenshot(payment.screenshot)}
                                className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors border border-emerald-500/20"
                              >
                                <ImageIcon className="w-3.5 h-3.5" /> View Screenshot
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReject(payment.id, payment.userId)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg font-bold text-sm transition-colors border border-rose-500/20"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                          <button
                            onClick={() => handleApprove(payment.id, payment.userId)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg font-bold text-sm transition-colors border border-emerald-500/20"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB: PENDING ACCOUNTS */}
          {activeTab === "pendingAccounts" && (
            <>
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" /> Pending Accounts ({pendingAccountsUsers.length})
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                {pendingAccountsUsers.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No pending accounts found.</div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="p-3 font-medium">User</th>
                        <th className="p-3 font-medium">Status</th>
                        <th className="p-3 font-medium">Devices</th>
                        <th className="p-3 font-medium">Joined</th>
                        <th className="p-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {pendingAccountsUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                  <User className="w-4 h-4 text-slate-400" />
                                </div>
                                {user.isOnline && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-white text-sm">{user.email}</p>
                                  {user.isOnline ? (
                                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Online</span>
                                  ) : (
                                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Offline</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">
                                  {user.phone ? `Phone: ${user.phone}` : "No phone provided"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400">
                              <Clock className="w-3 h-3" /> Pending Approval
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Smartphone className="w-4 h-4 text-slate-500" />
                                <span className="font-bold text-emerald-500">{user.activeDevices?.length ?? 0}</span>
                                <span className="text-xs text-slate-500">/ {user.deviceLimit || 3}</span>
                                <span className="text-[10px] text-slate-600 uppercase ml-1">Limit</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <span className="truncate max-w-[120px]">{user.deviceInfo || "Unknown Device"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-slate-400">
                            {formatTimestamp(user.createdAt, 'datetime', 'Unknown')}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApproveAccount(user.id)}
                                className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-colors flex items-center gap-1 px-3"
                                title="Approve Account"
                              >
                                <CheckCircle2 className="w-4 h-4" /> <span className="text-xs font-bold">Approve</span>
                              </button>
                              <button
                                onClick={() => handleActivate(user.id)}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors flex items-center gap-1 px-3"
                                title="Grant Full Access"
                              >
                                <Power className="w-4 h-4" /> <span className="text-xs font-bold">Full Access</span>
                              </button>
                              <button
                                onClick={() => setEditingUser(user)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1 px-3"
                                title="Edit User"
                              >
                                <Wrench className="w-4 h-4" /> <span className="text-xs font-bold">Edit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* TAB: STUDENTS */}
          {activeTab === "students" && (
            <>
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" /> Manage Students ({users.length})
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search by email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto hide-scrollbar">
                    <button
                      onClick={handleResetAllDevices}
                      className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-500 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap border border-rose-500/20 flex-shrink-0"
                      title="Reset device locks for ALL users"
                    >
                      <Monitor className="w-4 h-4" />
                      Reset All Devices
                    </button>
                    <button
                      onClick={() => setIsAddUserModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add User
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="p-3 font-medium">User</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Subscription</th>
                      <th className="p-3 font-medium">Devices</th>
                      <th className="p-3 font-medium">Last Login</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-400" />
                              </div>
                              {user.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-white text-sm">{user.email}</p>
                                {user.isOnline ? (
                                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Online</span>
                                ) : (
                                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Offline</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">
                                {user.role === "admin" ? (
                                  <span className="text-amber-400">Admin</span>
                                ) : "Student"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            user.status === "suspended" ? "bg-rose-500/10 text-rose-400" :
                            user.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                            user.isLifetimePaid ? "bg-emerald-500/10 text-emerald-400" :
                            "bg-slate-800 text-slate-400"
                          }`}>
                            {user.status === "suspended" ? <XCircle className="w-3 h-3" /> :
                             user.status === "pending" ? <Clock className="w-3 h-3" /> :
                             user.isLifetimePaid ? <CheckCircle2 className="w-3 h-3" /> :
                             <Clock className="w-3 h-3" />}
                            {user.status === "suspended" ? "Suspended" :
                             user.status === "pending" ? "Pending Approval" :
                             user.isLifetimePaid ? "Active" : "Pending/Inactive"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5">
                            {user.isLifetimePaid ? (
                              <span className="text-xs font-bold text-emerald-500">Unlimited Access</span>
                            ) : (
                              <>
                                <span className={`text-xs font-bold ${
                                  user.subscriptionEndDate?.toDate && user.subscriptionEndDate.toDate() < new Date() 
                                    ? "text-rose-500" 
                                    : "text-slate-300"
                                }`}>
                                  {user.subscriptionEndDate?.toDate 
                                    ? formatTimestamp(user.subscriptionEndDate, 'date', 'No Date') 
                                    : "No Date"}
                                </span>
                                {user.subscriptionEndDate?.toDate && (
                                  <span className="text-[10px] text-slate-500">
                                    {Math.ceil((user.subscriptionEndDate.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 0 
                                      ? `${Math.ceil((user.subscriptionEndDate.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                                      : "Expired"}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <Smartphone className="w-4 h-4 text-slate-500" />
                              <span className="font-bold text-emerald-500">{user.activeDevices?.length ?? 0}</span>
                              <span className="text-xs text-slate-500">/ {user.deviceLimit || 3}</span>
                              <span className="text-[10px] text-slate-600 uppercase ml-1">Limit</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <span className="truncate max-w-[120px]">{user.deviceInfo || "Unknown Device"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-400">
                          {user.lastLogin?.toDate ? formatTimestamp(user.lastLogin, 'datetime', 'Never') : formatTimestamp(user.createdAt, 'datetime', 'Never')}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            {user.status === "pending" && (
                              <button
                                onClick={() => handleApproveAccount(user.id)}
                                className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-colors"
                                title="Approve Account"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {user.status === "suspended" || !user.isLifetimePaid ? (
                              <button
                                onClick={() => handleActivate(user.id)}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors"
                                title="Grant Full Access"
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(user.id)}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors"
                                title="Suspend User"
                              >
                                <PowerOff className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleResetDevice(user.id)}
                              className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"
                              title="Reset Device Lock"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.email === "thealphafxpro@gmail.com"}
                              className={`p-2 rounded-lg transition-colors ${
                                user.email === "thealphafxpro@gmail.com" 
                                  ? "bg-slate-800 text-slate-600 cursor-not-allowed" 
                                  : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500"
                              }`}
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-slate-500">No users found.</div>
                )}
              </div>
            </>
          )}

          {/* TAB: ADMINS */}
          {activeTab === "admins" && (
            <>
              <div className="p-6 border-b border-slate-800 bg-amber-500/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="font-bold text-white text-xl flex items-center gap-2 mb-2">
                      <Shield className="w-6 h-6 text-amber-400" /> Admin Management
                    </h2>
                    <p className="text-slate-400 text-sm max-w-xl">
                      For safety and backup, it is highly recommended to have at least one additional admin account. 
                      To add a new admin, the person must first sign up as a regular user, then you can promote them here.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        placeholder="Enter user email to promote..."
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="w-full sm:w-72 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                      />
                      <select
                        value={adminRole}
                        onChange={(e) => setAdminRole(e.target.value)}
                        className="w-full sm:w-40 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      >
                        <option value="admin">Admin</option>
                        <option value="support_admin">Support Admin</option>
                        <option value="finance_admin">Finance Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Admin Notes..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full sm:w-72 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                      />
                      <input
                        type="date"
                        value={adminExpiration}
                        onChange={(e) => setAdminExpiration(e.target.value)}
                        className="w-full sm:w-40 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <button
                        onClick={handlePromoteToAdmin}
                        className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all whitespace-nowrap flex items-center justify-center gap-2 shadow-lg active:scale-95"
                      >
                        <UserPlus className="w-4 h-4" /> Add Admin
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-500/50 italic text-center sm:text-left">
                      * User must have logged in at least once before promotion.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="p-3 font-medium">Admin User</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Device Info</th>
                      <th className="p-3 font-medium">Last Login</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {adminUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                              <Shield className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{user.email}</p>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  user.email === "thealphafxpro@gmail.com" 
                                    ? "bg-amber-500 text-slate-950" 
                                    : "bg-slate-800 text-amber-400 border border-amber-500/20"
                                }`}>
                                  {user.email === "thealphafxpro@gmail.com" ? "SUPER ADMIN" : "ADMIN"}
                                </span>
                                {user.name && <span className="text-[10px] text-slate-500">{user.name}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            user.status === "suspended" ? "bg-rose-500/10 text-rose-400" :
                            user.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                            user.isLifetimePaid ? "bg-emerald-500/10 text-emerald-400" :
                            "bg-slate-800 text-slate-400"
                          }`}>
                            {user.status === "suspended" ? <XCircle className="w-3 h-3" /> :
                             user.status === "pending" ? <Clock className="w-3 h-3" /> :
                             user.isLifetimePaid ? <CheckCircle2 className="w-3 h-3" /> :
                             <Clock className="w-3 h-3" />}
                            {user.status === "suspended" ? "Suspended" :
                             user.status === "pending" ? "Pending Approval" :
                             user.isLifetimePaid ? "Active" : "Pending/Inactive"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            {user.deviceInfo?.includes("Mobile") ? <Smartphone className="w-4 h-4 text-slate-500" /> : <Monitor className="w-4 h-4 text-slate-500" />}
                            <span className="truncate max-w-[150px]" title={user.deviceInfo || "Unknown"}>
                              {user.deviceInfo || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-400">
                          {user.lastLogin?.toDate ? formatTimestamp(user.lastLogin, 'datetime', 'Never') : formatTimestamp(user.createdAt, 'datetime', 'Never')}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                              title="Edit Admin Details"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                            
                            {user.email !== "thealphafxpro@gmail.com" && (
                              <button
                                onClick={() => toggleAdminRole(user.id, user.role)}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors flex items-center gap-1 px-3"
                                title="Revoke Admin Access"
                              >
                                <ShieldOff className="w-4 h-4" /> <span className="text-xs font-bold">Revoke</span>
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleResetDevice(user.id)}
                              className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"
                              title="Reset Device Lock"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB: LOGS */}
          {activeTab === "logs" && (
            <>
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> System & Activity Logs
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="p-3 font-medium">User</th>
                      <th className="p-3 font-medium">Event / Status</th>
                      <th className="p-3 font-medium">Device Info</th>
                      <th className="p-3 font-medium">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {allUsersFiltered
                      .sort((a, b) => {
                        const timeA = a.lastLogin?.toDate ? a.lastLogin.toDate().getTime() : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0);
                        const timeB = b.lastLogin?.toDate ? b.lastLogin.toDate().getTime() : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0);
                        return timeB - timeA;
                      })
                      .map((user) => (
                      <tr key={`log-${user.id}`} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-400" />
                              </div>
                              {user.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">
                                {user.email || user.phone || "No Identifier"}
                              </p>
                              <div className="flex flex-col text-[10px] text-slate-500">
                                <span>{user.name || "No Name Set"}</span>
                                <span className="text-[8px] opacity-30 font-mono">ID: {user.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit ${
                              user.isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                            }`}>
                              {user.isOnline ? "User Online" : "User Offline"}
                            </span>
                            <span className="text-xs text-slate-400">
                              Role: <span className="text-white capitalize">{user.role}</span>
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            {user.deviceInfo?.includes("Mobile") ? <Smartphone className="w-4 h-4 text-slate-500" /> : <Monitor className="w-4 h-4 text-slate-500" />}
                            <span className="truncate max-w-[200px]" title={user.deviceInfo || "Unknown"}>
                              {user.deviceInfo || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-400">
                          <div className="flex flex-col">
                            <span className="text-white">
                              {user.lastLogin?.toDate ? formatTimestamp(user.lastLogin, 'datetime', 'Never') : formatTimestamp(user.createdAt, 'datetime', 'Never')}
                            </span>
                            {user.createdAt?.toDate && (
                              <span className="text-[10px] text-slate-500">
                                Joined: {formatTimestamp(user.createdAt, 'date', 'Unknown')}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB: TRADING ROOM */}
          {activeTab === "tradingRoom" && (
            <div className="p-6">
              <AdminTradingRoom />
            </div>
          )}

          {/* TAB: TOOLS */}
          {activeTab === "tools" && (
            <>
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-400" /> System Tools & Utilities
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Tool 1: Export Data */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                      <Download className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Export Database</h3>
                      <p className="text-xs text-slate-400">Download all user data as CSV</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-6 flex-1">
                    Export a complete list of all users, including their status, device info, and last login times. Useful for backups and external CRM tools.
                  </p>
                  <button
                    onClick={handleExportCSV}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Download className="w-4 h-4" /> Download CSV Report
                  </button>
                </div>

                {/* Tool 2: Password Generator */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                      <Key className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Password Generator</h3>
                      <p className="text-xs text-slate-400">Create secure passwords</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedPassword}
                        placeholder="Click generate..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono text-sm focus:outline-none"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl transition-colors border border-slate-700"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Strength: 
                        <span className={`ml-1 font-bold ${passwordStrength === 'Strong' ? 'text-emerald-500' : passwordStrength === 'Medium' ? 'text-amber-500' : 'text-rose-500'}`}>
                          {passwordStrength}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 flex-1">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Length: {passwordLength}</span>
                      </div>
                      <input
                        type="range"
                        min="6"
                        max="32"
                        value={passwordLength}
                        onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeUppercase}
                          onChange={(e) => setIncludeUppercase(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-950 bg-slate-900"
                        />
                        <span className="text-slate-300 text-xs">A-Z</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeNumbers}
                          onChange={(e) => setIncludeNumbers(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-950 bg-slate-900"
                        />
                        <span className="text-slate-300 text-xs">0-9</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeSymbols}
                          onChange={(e) => setIncludeSymbols(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-950 bg-slate-900"
                        />
                        <span className="text-slate-300 text-xs">!@#$</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={excludeAmbiguous}
                          onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-950 bg-slate-900"
                        />
                        <span className="text-slate-300 text-xs">No Ambiguous</span>
                      </label>
                    </div>

                    <div className="pt-2 flex gap-2">
                        <button onClick={() => generatePassword('pin')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] py-1 rounded">PIN</button>
                        <button onClick={() => generatePassword('easy')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] py-1 rounded">Easy</button>
                        <button onClick={() => generatePassword('high')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] py-1 rounded">High</button>
                    </div>
                  </div>

                  <button
                    onClick={() => generatePassword()}
                    className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border border-indigo-500/20 text-sm mb-4"
                  >
                    <RefreshCw className="w-4 h-4" /> Generate
                  </button>

                  {passwordHistory.length > 0 && (
                    <div className="border-t border-slate-800 pt-4">
                        <p className="text-[10px] text-slate-500 uppercase mb-2">History</p>
                        <div className="space-y-1">
                            {passwordHistory.map((p, i) => (
                                <p key={i} className="text-[10px] font-mono text-slate-400 truncate">{p}</p>
                            ))}
                        </div>
                    </div>
                  )}
                </div>

                {/* Tool 3: Tawk.to Free Live Chat Integration */}
                <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 flex flex-col lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/25">
                        <MessageCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">Tawk.to Live Chat Desk</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            100% Free Forever
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">Connect in-browser live chat directly to your phone app</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {tawkPropInput ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-mono">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Live Chat Active
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                          Not Configured Yet
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Install the free <strong>Tawk.to</strong> mobile app from Google Play / App Store. When students message on Aladdin Trade Manager, you will receive real-time notifications on your phone and reply without exposing any personal contact numbers!
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Tawk.to Property ID *
                      </label>
                      <input
                        type="text"
                        placeholder="6aedf91657710a4002b40288"
                        value={tawkPropInput}
                        onChange={(e) => setTawkPropInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Tawk.to Widget ID
                      </label>
                      <input
                        type="text"
                        placeholder="default"
                        value={tawkWidgetInput}
                        onChange={(e) => setTawkWidgetInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {tawkSavedMsg && (
                    <div className="mb-4 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 p-2.5 rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{tawkSavedMsg}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
                    <p className="text-[11px] text-slate-500">
                      Get your ID from <strong>tawk.to → Administration → Property Settings → Property ID</strong>.
                    </p>
                    <button
                      onClick={() => {
                        setTawkToPropertyId(tawkPropInput);
                        setTawkToWidgetId(tawkWidgetInput);
                        fetch('/api/tawk-config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ propertyId: tawkPropInput, widgetId: tawkWidgetInput })
                        }).catch(() => {});
                        setTawkSavedMsg("✅ Tawk.to Configuration Saved! Reload the app to initialize the live chat widget.");
                        setTimeout(() => setTawkSavedMsg(""), 4000);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2 px-5 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer self-stretch sm:self-auto"
                    >
                      Save & Enable Live Chat
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Add User Modal */}
          {isAddUserModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-500" /> Add New User
                  </h3>
                  <button
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {addUserError && (
                  <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
                    {addUserError}
                  </div>
                )}
                
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="student@example.com"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-slate-400">Password *</label>
                      <button
                        type="button"
                        onClick={handleAutoGeneratePassword}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Auto Generate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showNewUserPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-16 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="Minimum 6 characters"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (newUserPassword) navigator.clipboard.writeText(newUserPassword);
                          }}
                          className="text-slate-500 hover:text-indigo-400 transition-colors"
                          title="Copy Password"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showNewUserPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Full Name (Optional)</label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="+91..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Subscription Duration *</label>
                    <select
                      value={newUserDuration}
                      onChange={(e) => setNewUserDuration(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="3_days">3 Days</option>
                      <option value="7_days">7 Days</option>
                      <option value="30_days">30 Days</option>
                      <option value="3_months">3 Months</option>
                      <option value="6_months">6 Months</option>
                      <option value="12_months">12 Months</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingUser}
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex justify-center items-center"
                    >
                      {isAddingUser ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        "Create User"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
