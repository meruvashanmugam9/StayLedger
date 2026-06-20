/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building, 
  Home, 
  Users, 
  DollarSign, 
  Divide, 
  Database, 
  Layers,
  Sparkles,
  Bell,
  Briefcase,
  TrendingUp,
  Lock,
  RefreshCw
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// Firebase imports
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, deleteDoc, collection, onSnapshot, getDocs, writeBatch, getDoc } from 'firebase/firestore';

// Type imports
import { 
  Room, 
  Guest, 
  Payment, 
  DeletedGuest,
  BusinessConfig,
  INITIAL_ROOMS, 
  INITIAL_GUESTS, 
  INITIAL_PAYMENTS,
  INITIAL_BUSINESS_CONFIG
} from './types';

// Component imports
import Dashboard from './components/Dashboard';
import RoomsSection from './components/RoomsSection';
import GuestsSection from './components/GuestsSection';
import PaymentsSection from './components/PaymentsSection';
import UtilitySplitter from './components/UtilitySplitter';
import RemindersSection from './components/RemindersSection';
import AnalyticsSection from './components/AnalyticsSection';
import BusinessHub from './components/BusinessHub';
import PlatformAdmin, { SubscriptionMonthRecord } from './components/PlatformAdmin';

export default function App() {
  const CLIENT_VERSION = '1.3.0'; // Current deployed features bundle version
  const [appConfig, setAppConfig] = useState<{
    latestVersion: string;
    downloadUrl: string;
    updateNotes: string;
    isCritical: boolean;
  } | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);

  // States for legacy tompippopentertainment@gmail.com data migration and profile cleanup
  const [legacyMigrateUser, setLegacyMigrateUser] = useState<{
    uid: string;
    email: string;
    displayName?: string;
    roomCount?: number;
    guestCount?: number;
  } | null>(null);
  const [showMigrationModal, setShowMigrationModal] = useState<boolean>(false);
  const [migrationInProgress, setMigrationInProgress] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>('Dashboard');

  // User and cloud states
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // State declaration with lazy loading (local states fallback)
  const [rooms, setRooms] = useState<Room[]>(() => {
    const cached = localStorage.getItem('pg_rooms');
    return cached ? JSON.parse(cached) : INITIAL_ROOMS;
  });

  const [guests, setGuests] = useState<Guest[]>(() => {
    const cached = localStorage.getItem('pg_guests');
    return cached ? JSON.parse(cached) : INITIAL_GUESTS;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const cached = localStorage.getItem('pg_payments');
    return cached ? JSON.parse(cached) : INITIAL_PAYMENTS;
  });

  const [deletedGuests, setDeletedGuests] = useState<DeletedGuest[]>(() => {
    const cached = localStorage.getItem('pg_deleted_guests');
    return cached ? JSON.parse(cached) : [];
  });

  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>(() => {
    const cached = localStorage.getItem('pg_business_config');
    return cached ? JSON.parse(cached) : INITIAL_BUSINESS_CONFIG;
  });

  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'suspended' | 'unpaid'>('active');
  const [suspensionMessage, setSuspensionMessage] = useState<string>('');
  const [subscriptionLedger, setSubscriptionLedger] = useState<SubscriptionMonthRecord[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const migrationRef = useRef<boolean>(false);

  // Auth State Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser && !migrationRef.current) {
        migrationRef.current = true;
        setIsSyncing(true);
        try {
          const roomsRef = collection(db, 'users', currentUser.uid, 'rooms');
          const roomsSnap = await getDocs(roomsRef);

          if (roomsSnap.empty) {
            // First login migration: upload current local storage state to cloud
            const tempRooms = JSON.parse(localStorage.getItem('pg_rooms') || '[]');
            const tempGuests = JSON.parse(localStorage.getItem('pg_guests') || '[]');
            const tempPayments = JSON.parse(localStorage.getItem('pg_payments') || '[]');
            const tempDeleted = JSON.parse(localStorage.getItem('pg_deleted_guests') || '[]');
            const tempConfig = JSON.parse(localStorage.getItem('pg_business_config') || 'null');

            const batch = writeBatch(db);
            if (tempRooms.length > 0 || tempGuests.length > 0 || tempPayments.length > 0 || tempDeleted.length > 0) {
              tempRooms.forEach((r: Room) => {
                batch.set(doc(db, 'users', currentUser.uid, 'rooms', r.id), r);
              });
              tempGuests.forEach((g: Guest) => {
                batch.set(doc(db, 'users', currentUser.uid, 'guests', g.id), g);
              });
              tempPayments.forEach((p: Payment) => {
                batch.set(doc(db, 'users', currentUser.uid, 'payments', p.id), p);
              });
              tempDeleted.forEach((d: DeletedGuest) => {
                batch.set(doc(db, 'users', currentUser.uid, 'deletedGuests', d.id), d);
              });
            }
            // Always set business settings in first migration batch
            batch.set(
              doc(db, 'users', currentUser.uid, 'businessConfig', 'settings'), 
              tempConfig || INITIAL_BUSINESS_CONFIG
            );

            await batch.commit();
            console.log('Sandbox data migrated to the secure cloud account successfully.');
          }
        } catch (error) {
          console.error("Data migration to cloud failed: ", error);
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Look for legacy tompippopentertainment@gmail.com account data to import to meruvashanmugam9@gmail.com
  useEffect(() => {
    if (!user || user.email?.toLowerCase() !== 'meruvashanmugam9@gmail.com') return;

    const findLegacyUser = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snap = await getDocs(usersRef);
        let foundLegacy: any = null;
        
        snap.forEach((d) => {
          const data = d.data();
          if (data.email?.toLowerCase() === 'tompippopentertainment@gmail.com') {
            foundLegacy = {
              uid: d.id,
              email: data.email,
              displayName: data.displayName,
              roomCount: data.roomCount || 0,
              guestCount: data.guestCount || 0
            };
          }
        });

        if (foundLegacy) {
          // Check if current user already has migrated data (rooms or guests)
          const curRoomsSnap = await getDocs(collection(db, 'users', user.uid, 'rooms'));
          if (curRoomsSnap.empty) {
            setLegacyMigrateUser(foundLegacy);
            setShowMigrationModal(true);
          }
        }
      } catch (err) {
        console.warn("Could not find matching legacy account directories:", err);
      }
    };

    // Delay a bit to allow connections to establish securely
    const delayTimer = setTimeout(() => {
      findLegacyUser();
    }, 2000);

    return () => clearTimeout(delayTimer);
  }, [user]);

  const handleLegacyMigration = async () => {
    if (!user || !legacyMigrateUser) return;
    setMigrationInProgress(true);
    try {
      // 1. Fetch all data from the old user subcollections
      const oldRoomsSnap = await getDocs(collection(db, 'users', legacyMigrateUser.uid, 'rooms'));
      const oldGuestsSnap = await getDocs(collection(db, 'users', legacyMigrateUser.uid, 'guests'));
      const oldPaymentsSnap = await getDocs(collection(db, 'users', legacyMigrateUser.uid, 'payments'));
      const oldDeletedSnap = await getDocs(collection(db, 'users', legacyMigrateUser.uid, 'deletedGuests'));
      const oldConfigSnap = await getDoc(doc(db, 'users', legacyMigrateUser.uid, 'businessConfig', 'settings'));

      const batch = writeBatch(db);

      // Copy Rooms
      oldRoomsSnap.forEach((d) => {
        batch.set(doc(db, 'users', user.uid, 'rooms', d.id), d.data());
      });

      // Copy Guests
      oldGuestsSnap.forEach((d) => {
        batch.set(doc(db, 'users', user.uid, 'guests', d.id), d.data());
      });

      // Copy Payments
      oldPaymentsSnap.forEach((d) => {
        batch.set(doc(db, 'users', user.uid, 'payments', d.id), d.data());
      });

      // Copy Deleted Guests
      oldDeletedSnap.forEach((d) => {
        batch.set(doc(db, 'users', user.uid, 'deletedGuests', d.id), d.data());
      });

      // Copy Business Config
      if (oldConfigSnap.exists()) {
        batch.set(doc(db, 'users', user.uid, 'businessConfig', 'settings'), oldConfigSnap.data());
      }

      // Update User profile information
      batch.set(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: legacyMigrateUser.displayName || user.displayName || 'PG Owner',
        lastActive: new Date().toISOString(),
        subscriptionStatus: 'active'
      }, { merge: true });

      // 2. Commit all writes to the new user ID
      await batch.commit();

      // 3. Purging the old registered account as requested ("remove it and update my gmail like...")
      const deleteBatch = writeBatch(db);
      oldRoomsSnap.forEach((d) => {
        deleteBatch.delete(doc(db, 'users', legacyMigrateUser.uid, 'rooms', d.id));
      });
      oldGuestsSnap.forEach((d) => {
        deleteBatch.delete(doc(db, 'users', legacyMigrateUser.uid, 'guests', d.id));
      });
      oldPaymentsSnap.forEach((d) => {
        deleteBatch.delete(doc(db, 'users', legacyMigrateUser.uid, 'payments', d.id));
      });
      oldDeletedSnap.forEach((d) => {
        deleteBatch.delete(doc(db, 'users', legacyMigrateUser.uid, 'deletedGuests', d.id));
      });
      deleteBatch.delete(doc(db, 'users', legacyMigrateUser.uid, 'businessConfig', 'settings'));
      deleteBatch.delete(doc(db, 'users', legacyMigrateUser.uid));

      await deleteBatch.commit();

      alert("🎉 Cloud migration complete! All PG rooms, guests, payments and custom credentials have been securely registered to meruvashanmugam9@gmail.com, and the old tompippopentertainment@gmail.com account was safely removed.");
      setShowMigrationModal(false);
      window.location.reload();
    } catch (err) {
      console.error("Migration error:", err);
      alert("Failed during secure database migration: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setMigrationInProgress(false);
    }
  };

  // Listen to Global App configuration for update notifier alerts
  useEffect(() => {
    const configRef = doc(db, 'system', 'app_config');
    const unsubSystem = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAppConfig({
          latestVersion: data.latestVersion || '1.3.0',
          downloadUrl: data.downloadUrl || '',
          updateNotes: data.updateNotes || '',
          isCritical: !!data.isCritical
        });

        // Version comparison helper: check if client needs update
        const clientSec = CLIENT_VERSION.split('.').map(Number);
        const serverSec = (data.latestVersion || '1.3.0').split('.').map(Number);
        
        let needsUpdate = false;
        for (let i = 0; i < Math.max(clientSec.length, serverSec.length); i++) {
          const c = clientSec[i] || 0;
          const s = serverSec[i] || 0;
          if (s > c) {
            needsUpdate = true;
            break;
          } else if (c > s) {
            break;
          }
        }
        if (needsUpdate) {
          setShowUpdateModal(true);
        } else {
          setShowUpdateModal(false);
        }
      }
    }, (error) => {
      console.warn("Could not read global system version configs. Local operation continues.", error);
    });

    return () => unsubSystem();
  }, []);

  // Real-time Cloud Synchronization
  useEffect(() => {
    if (!user) return;

    setIsSyncing(true);

    const roomsRef = collection(db, 'users', user.uid, 'rooms');
    const unsubRooms = onSnapshot(roomsRef, (snap) => {
      const list: Room[] = [];
      snap.forEach(d => list.push(d.data() as Room));
      setRooms(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/rooms`);
    });

    const guestsRef = collection(db, 'users', user.uid, 'guests');
    const unsubGuests = onSnapshot(guestsRef, (snap) => {
      const list: Guest[] = [];
      snap.forEach(d => list.push(d.data() as Guest));
      setGuests(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/guests`);
    });

    const paymentsRef = collection(db, 'users', user.uid, 'payments');
    const unsubPayments = onSnapshot(paymentsRef, (snap) => {
      const list: Payment[] = [];
      snap.forEach(d => list.push(d.data() as Payment));
      setPayments(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/payments`);
    });

    const deletedGuestsRef = collection(db, 'users', user.uid, 'deletedGuests');
    const unsubDeletedGuests = onSnapshot(deletedGuestsRef, (snap) => {
      const list: DeletedGuest[] = [];
      snap.forEach(d => list.push(d.data() as DeletedGuest));
      setDeletedGuests(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/deletedGuests`);
    });

    const configDocRef = doc(db, 'users', user.uid, 'businessConfig', 'settings');
    const unsubConfig = onSnapshot(configDocRef, (snap) => {
      if (snap.exists()) {
        setBusinessConfig(snap.data() as BusinessConfig);
      }
      setIsSyncing(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/businessConfig/settings`);
    });

    const userDocRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSubscriptionStatus(data.subscriptionStatus || 'active');
        setSuspensionMessage(data.suspensionMessage || '');
        setSubscriptionLedger(data.subscriptionLedger || []);
      } else {
        setSubscriptionStatus('active');
        setSuspensionMessage('');
        setSubscriptionLedger([]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => {
      unsubRooms();
      unsubGuests();
      unsubPayments();
      unsubDeletedGuests();
      unsubConfig();
      unsubUser();
    };
  }, [user]);

  // Synchronize User profile details to root `/users/{userId}` for Platform Admin visibility
  useEffect(() => {
    if (!user) return;
    
    const syncProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || businessConfig.landlordName || 'PG Owner',
          businessName: businessConfig.businessName || 'EasyStay PG',
          phone: businessConfig.phone || '',
          roomCount: rooms.length,
          guestCount: guests.filter(g => !g.isCheckedOut).length,
          lastActive: new Date().toISOString(),
        }, { merge: true });
      } catch (error) {
        // Console log instead of halting if permission is denied (e.g. before login complete or dev offline)
        console.warn("User stats sync info:", error);
      }
    };

    const timer = setTimeout(() => {
      syncProfile();
    }, 5500);

    return () => clearTimeout(timer);
  }, [user, rooms.length, guests.length, businessConfig.businessName, businessConfig.landlordName, businessConfig.phone]);

  // Sync state with localStorage (fallback Cache for offline operation)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('pg_rooms', JSON.stringify(rooms));
    }
  }, [rooms, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('pg_guests', JSON.stringify(guests));
    }
  }, [guests, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('pg_payments', JSON.stringify(payments));
    }
  }, [payments, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('pg_deleted_guests', JSON.stringify(deletedGuests));
    }
  }, [deletedGuests, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('pg_business_config', JSON.stringify(businessConfig));
    }
  }, [businessConfig, user]);

  // Cleanup: Purge deleted logs older than 30 days automatically
  useEffect(() => {
    if (user) return; // Managed server-side or filtered on list if online, let's keep local cleanup for offline
    setDeletedGuests(prev => {
      const thirtyDaysAgoMs = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const filtered = prev.filter(dg => {
        const deletedTime = new Date(dg.deletedAt).getTime();
        return (now - deletedTime) < thirtyDaysAgoMs;
      });
      if (filtered.length !== prev.length) {
        return filtered;
      }
      return prev;
    });
  }, [user]);

  // Handler: Google Sign-in and Log-out
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google login failed: ", error);
      alert("Sign in failed. Please check popup permissions and try again.");
    }
  };

  const handleLogout = async () => {
    if (confirm("Disconnect cloud sync and log out of EasyStay?")) {
      try {
        await signOut(auth);
        setUser(null);
        migrationRef.current = false;
        // Revert local state to cached LocalStorage sandbox
        const cachedRooms = localStorage.getItem('pg_rooms');
        const cachedGuests = localStorage.getItem('pg_guests');
        const cachedPayments = localStorage.getItem('pg_payments');
        const cachedDeleted = localStorage.getItem('pg_deleted_guests');
        
        setRooms(cachedRooms ? JSON.parse(cachedRooms) : INITIAL_ROOMS);
        setGuests(cachedGuests ? JSON.parse(cachedGuests) : INITIAL_GUESTS);
        setPayments(cachedPayments ? JSON.parse(cachedPayments) : INITIAL_PAYMENTS);
        setDeletedGuests(cachedDeleted ? JSON.parse(cachedDeleted) : []);
      } catch (error) {
        console.error("Logout failed: ", error);
      }
    }
  };

  // Handler: Add Room
  const handleAddRoom = async (newRoom: Room) => {
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'rooms', newRoom.id), newRoom);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/rooms/${newRoom.id}`);
      }
    } else {
      setRooms(prev => [...prev, newRoom]);
    }
  };

  // Handler: Update Room
  const handleUpdateRoom = async (updatedRoom: Room) => {
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'rooms', updatedRoom.id), updatedRoom);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/rooms/${updatedRoom.id}`);
      }
    } else {
      setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    }
  };

  // Handler: Delete Room
  const handleDeleteRoom = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'rooms', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/rooms/${id}`);
      }
    } else {
      setRooms(prev => prev.filter(r => r.id !== id));
    }
  };

  // Handler: Guest Check-in & Auto billing posting
  const handleCheckInGuest = async (newGuest: Guest, generateInitialBills: boolean) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        const guestDoc = doc(db, 'users', user.uid, 'guests', newGuest.id);
        batch.set(guestDoc, newGuest);

        if (generateInitialBills) {
          const room = rooms.find(r => r.id === newGuest.roomId);
          if (room) {
            const rentBill: Payment = {
              id: 'pay_rent_init_' + Date.now() + '_1',
              guestId: newGuest.id,
              guestName: newGuest.name,
              roomNumber: room.roomNumber,
              type: 'Rent',
              amount: room.rentPrice,
              billingPeriod: 'June 2026',
              dueDate: '2026-06-05',
              status: 'Unpaid',
              description: 'First month accommodation rent'
            };
            batch.set(doc(db, 'users', user.uid, 'payments', rentBill.id), rentBill);

            if (room.utilityType === 'Fixed') {
              const utilityBill: Payment = {
                id: 'pay_util_init_' + Date.now() + '_2',
                guestId: newGuest.id,
                guestName: newGuest.name,
                roomNumber: room.roomNumber,
                type: 'Utility',
                amount: room.fixedUtilityAmount || 0,
                billingPeriod: 'June 2026',
                dueDate: '2026-06-05',
                status: 'Unpaid',
                description: 'Flat fee Utility (Fixed Plan)'
              };
              batch.set(doc(db, 'users', user.uid, 'payments', utilityBill.id), utilityBill);
            }
          }
        }
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/guests/${newGuest.id}`);
      }
    } else {
      setGuests(prev => [...prev, newGuest]);

      if (generateInitialBills) {
        const room = rooms.find(r => r.id === newGuest.roomId);
        if (room) {
          const rentBill: Payment = {
            id: 'pay_rent_init_' + Date.now() + '_1',
            guestId: newGuest.id,
            guestName: newGuest.name,
            roomNumber: room.roomNumber,
            type: 'Rent',
            amount: room.rentPrice,
            billingPeriod: 'June 2026',
            dueDate: '2026-06-05',
            status: 'Unpaid',
            description: 'First month accommodation rent'
          };

          const utilityBill: Payment | null = room.utilityType === 'Fixed' ? {
            id: 'pay_util_init_' + Date.now() + '_2',
            guestId: newGuest.id,
            guestName: newGuest.name,
            roomNumber: room.roomNumber,
            type: 'Utility',
            amount: room.fixedUtilityAmount || 0,
            billingPeriod: 'June 2026',
            dueDate: '2026-06-05',
            status: 'Unpaid',
            description: 'Flat fee Utility (Fixed Plan)'
          } : null;

          setPayments(prev => {
            const updated = [...prev, rentBill];
            if (utilityBill) updated.push(utilityBill);
            return updated;
          });
        }
      }
    }
  };

  // Handler: Update Guest Contacts
  const handleUpdateGuest = async (updatedGuest: Guest) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', user.uid, 'guests', updatedGuest.id), updatedGuest);

        // Synced names in payment history
        payments.forEach(p => {
          if (p.guestId === updatedGuest.id) {
            const roomObj = rooms.find(r => r.id === updatedGuest.roomId);
            const updatedPayment: Payment = {
              ...p,
              guestName: updatedGuest.name,
              roomNumber: roomObj ? roomObj.roomNumber : p.roomNumber
            };
            batch.set(doc(db, 'users', user.uid, 'payments', p.id), updatedPayment);
          }
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/guests/${updatedGuest.id}`);
      }
    } else {
      setGuests(prev => prev.map(g => g.id === updatedGuest.id ? updatedGuest : g));
      setPayments(prev => prev.map(p => {
        if (p.guestId === updatedGuest.id) {
          const roomObj = rooms.find(r => r.id === updatedGuest.roomId);
          return {
            ...p,
            guestName: updatedGuest.name,
            roomNumber: roomObj ? roomObj.roomNumber : p.roomNumber
          };
        }
        return p;
      }));
    }
  };

  // Handler: Check-out guest & free up bed vacancy
  const handleCheckoutGuest = async (guestId: string) => {
    if (user) {
      try {
        const targetGuest = guests.find(g => g.id === guestId);
        if (targetGuest) {
          const updatedGuest: Guest = { ...targetGuest, status: 'CheckedOut', roomId: '' };
          await setDoc(doc(db, 'users', user.uid, 'guests', guestId), updatedGuest);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/guests/${guestId}`);
      }
    } else {
      setGuests(prev => prev.map(g => g.id === guestId ? { ...g, status: 'CheckedOut', roomId: '' } : g));
    }
  };

  // Handler: Delete history log (soft delete to history)
  const handleDeleteGuestHistory = async (guestId: string) => {
    const targetGuest = guests.find(g => g.id === guestId);
    if (!targetGuest) return;

    // Find and back up all associated payments
    const associatedPayments = payments.filter(p => p.guestId === guestId);

    const deletedItem: DeletedGuest = {
      id: guestId,
      guest: targetGuest,
      deletedAt: new Date().toISOString(),
      originalPayments: associatedPayments
    };

    if (user) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', user.uid, 'deletedGuests', guestId), deletedItem);
        batch.delete(doc(db, 'users', user.uid, 'guests', guestId));
        associatedPayments.forEach(p => {
          if (p.status !== 'Paid') {
            batch.delete(doc(db, 'users', user.uid, 'payments', p.id));
          }
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/guests/${guestId}`);
      }
    } else {
      setDeletedGuests(prev => {
        const filtered = prev.filter(item => item.id !== guestId);
        return [...filtered, deletedItem];
      });

      setGuests(prev => prev.filter(g => g.id !== guestId));
      // We clean active payments that were unpaid to avoid ghost invoice dues from active ledger
      setPayments(prev => prev.filter(p => !(p.guestId === guestId && p.status !== 'Paid')));
    }
  };

  // Handler: Restore soft-deleted guest history & restore their payments
  const handleRestoreGuest = async (guestId: string) => {
    const deletedItem = deletedGuests.find(dg => dg.id === guestId);
    if (!deletedItem) return;

    // Check if originally assigned room has a vacancy
    const room = rooms.find(r => r.id === deletedItem.guest.roomId);
    let finalRoomId = deletedItem.guest.roomId;
    
    if (finalRoomId) {
      if (!room || room.status === 'Maintenance') {
        const confirmRestoreNoRoom = confirm(
          `Cannot automatic-assign to the original Room (${room ? 'Under Maintenance' : 'Deleted'}).\n\n` +
          `Would you like to restore "${deletedItem.guest.name}" with room unassigned?`
        );
        if (!confirmRestoreNoRoom) return;
        finalRoomId = '';
      } else {
        const activeOccupantsInRoom = guests.filter(g => g.roomId === room.id && g.status === 'Active').length;
        if (activeOccupantsInRoom >= room.capacity) {
          const confirmRestoreFullRoom = confirm(
            `Original Room ${room.roomNumber} is currently full (occupied: ${activeOccupantsInRoom}/${room.capacity}).\n\n` +
            `Would you like to restore "${deletedItem.guest.name}" anyway? They will temporarily share the room, or you can reassign their room after restoring.`
          );
          if (!confirmRestoreFullRoom) return;
        }
      }
    }

    // Restore guest back
    const restoredGuest: Guest = {
      ...deletedItem.guest,
      roomId: finalRoomId,
    };

    if (user) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', user.uid, 'guests', guestId), restoredGuest);
        if (deletedItem.originalPayments && deletedItem.originalPayments.length > 0) {
          deletedItem.originalPayments.forEach(p => {
            batch.set(doc(db, 'users', user.uid, 'payments', p.id), p);
          });
        }
        batch.delete(doc(db, 'users', user.uid, 'deletedGuests', guestId));
        await batch.commit();
        alert(`"${deletedItem.guest.name}" has been successfully restored to the registry!`);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/guests/${guestId}`);
      }
    } else {
      setGuests(prev => {
        if (prev.some(g => g.id === guestId)) return prev;
        return [...prev, restoredGuest];
      });

      // Restore payments back to the ledger
      if (deletedItem.originalPayments && deletedItem.originalPayments.length > 0) {
        setPayments(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const paymentsToRestore = deletedItem.originalPayments.filter(p => !existingIds.has(p.id));
          return [...prev, ...paymentsToRestore];
        });
      }

      setDeletedGuests(prev => prev.filter(dg => dg.id !== guestId));
      alert(`"${deletedItem.guest.name}" has been successfully restored to the registry!`);
    }
  };

  // Handler: Permanently delete a guest from recycle bin history
  const handlePermanentDeleteGuest = async (guestId: string) => {
    const target = deletedGuests.find(dg => dg.id === guestId);
    const targetName = target ? target.guest.name : 'this guest';
    if (confirm(`Are you absolutely sure you want to PERMANENTLY erase all data for "${targetName}"?\n\nThis will purge all history and cannot be undone.`)) {
      if (user) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'deletedGuests', guestId));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/deletedGuests/${guestId}`);
        }
      } else {
        setDeletedGuests(prev => prev.filter(dg => dg.id !== guestId));
      }
    }
  };

  // Handler: Add Single Custom Bill
  const handleAddPayment = async (newPayment: Payment) => {
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'payments', newPayment.id), newPayment);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/payments/${newPayment.id}`);
      }
    } else {
      setPayments(prev => [...prev, newPayment]);
    }
  };

  // Handler: Update transaction payments
  const handleUpdatePayment = async (updatedPayment: Payment) => {
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'payments', updatedPayment.id), updatedPayment);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/payments/${updatedPayment.id}`);
      }
    } else {
      setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
    }
  };

  // Handler: Delete ledger item
  const handleDeletePayment = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'payments', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/payments/${id}`);
      }
    } else {
      setPayments(prev => prev.filter(p => p.id !== id));
    }
  };

  // Handler: Publish Utility Splits
  const handleApplyBills = async (newBills: Payment[]) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        newBills.forEach(bill => {
          batch.set(doc(db, 'users', user.uid, 'payments', bill.id), bill);
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/payments`);
      }
    } else {
      setPayments(prev => [...prev, ...newBills]);
    }
  };

  // Handler: Quick mark as paid from dashboard
  const handleQuickPay = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const targetPayment = payments.find(p => p.id === id);
    if (!targetPayment) return;

    if (user) {
      try {
        const updatedPayment: Payment = { ...targetPayment, status: 'Paid', paidDate: today };
        await setDoc(doc(db, 'users', user.uid, 'payments', id), updatedPayment);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/payments/${id}`);
      }
    } else {
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'Paid', paidDate: today } : p));
    }
  };

  // Handler: Save custom business configuration
  const handleSaveConfig = async (updated: BusinessConfig) => {
    setBusinessConfig(updated);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'businessConfig', 'settings'), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/businessConfig/settings`);
      }
    } else {
      localStorage.setItem('pg_business_config', JSON.stringify(updated));
    }
  };

  // Backup: Reset all data back to original default mock examples
  const handleResetToDefault = async () => {
    if (confirm('Reset to standard template? This will override your present changes.')) {
      if (user) {
        try {
          setIsSyncing(true);
          const batch = writeBatch(db);
          rooms.forEach(r => batch.delete(doc(db, 'users', user.uid, 'rooms', r.id)));
          guests.forEach(g => batch.delete(doc(db, 'users', user.uid, 'guests', g.id)));
          payments.forEach(p => batch.delete(doc(db, 'users', user.uid, 'payments', p.id)));
          deletedGuests.forEach(dg => batch.delete(doc(db, 'users', user.uid, 'deletedGuests', dg.id)));

          INITIAL_ROOMS.forEach(r => batch.set(doc(db, 'users', user.uid, 'rooms', r.id), r));
          INITIAL_GUESTS.forEach(g => batch.set(doc(db, 'users', user.uid, 'guests', g.id), g));
          INITIAL_PAYMENTS.forEach(p => batch.set(doc(db, 'users', user.uid, 'payments', p.id), p));
          await batch.commit();
          setActiveTab('Dashboard');
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setRooms(INITIAL_ROOMS);
        setGuests(INITIAL_GUESTS);
        setPayments(INITIAL_PAYMENTS);
        setDeletedGuests([]);
        setActiveTab('Dashboard');
      }
    }
  };

  // Backup: Export PG database as a JSON download file
  const handleExportDataJson = () => {
    const packagePayload = {
      rooms,
      guests,
      payments,
      deletedGuests,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(packagePayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `PG_App_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Backup: Import a PG database JSON load
  const handleImportDataJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        if (payload.rooms && payload.guests && payload.payments) {
          if (user) {
            setIsSyncing(true);
            const batch = writeBatch(db);
            rooms.forEach(r => batch.delete(doc(db, 'users', user.uid, 'rooms', r.id)));
            guests.forEach(g => batch.delete(doc(db, 'users', user.uid, 'guests', g.id)));
            payments.forEach(p => batch.delete(doc(db, 'users', user.uid, 'payments', p.id)));
            deletedGuests.forEach(dg => batch.delete(doc(db, 'users', user.uid, 'deletedGuests', dg.id)));

            payload.rooms.forEach((r: any) => batch.set(doc(db, 'users', user.uid, 'rooms', r.id), r));
            payload.guests.forEach((g: any) => batch.set(doc(db, 'users', user.uid, 'guests', g.id), g));
            payload.payments.forEach((p: any) => batch.set(doc(db, 'users', user.uid, 'payments', p.id), p));
            if (payload.deletedGuests) {
              payload.deletedGuests.forEach((dg: any) => batch.set(doc(db, 'users', user.uid, 'deletedGuests', dg.id), dg));
            }
            await batch.commit();
            alert('System backup loaded and synced successfully!');
            setActiveTab('Dashboard');
          } else {
            setRooms(payload.rooms);
            setGuests(payload.guests);
            setPayments(payload.payments);
            setDeletedGuests(payload.deletedGuests || []);
            alert('System backup loaded successfully!');
            setActiveTab('Dashboard');
          }
        } else {
          alert('Missing valid databases attributes in file payload.');
        }
      } catch (err) {
        alert('Invalid backup structure format .json.');
      } finally {
        setIsSyncing(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // clear input
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row selection:bg-indigo-100 selection:text-indigo-800 text-slate-800">
      
      {/* Side Navigation - EasyStay Aesthetic */}
      <aside className="w-full md:w-60 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col p-4 shrink-0 z-40 md:h-screen md:sticky md:top-0 md:overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
            <Building className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm tracking-tight text-slate-900 leading-tight truncate block" title={businessConfig?.businessName || 'EasyStay'}>
              {businessConfig?.businessName || 'EasyStay'}
            </h1>
            <span className="text-[8px] font-bold text-indigo-650 tracking-wider uppercase block">PG Accommodation</span>
          </div>
        </div>

        {/* Cloud Persistence & Backup SaaS Status Widget */}
        <div className="mb-3.5 p-3 rounded-xl border transition duration-200 bg-linear-to-b from-indigo-50/10 to-indigo-50/30 border-indigo-100 shadow-3xs">
          <div className="flex items-center justify-between mb-1.55">
            <span className="text-[9px] font-bold text-indigo-600 tracking-wider uppercase flex items-center gap-1">
              <Database className="w-2.5 h-2.5" />
              <span>Cloud Engine</span>
            </span>
            {authLoading ? (
              <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
            ) : user ? (
              <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-green-50 text-green-700 border border-green-150 flex items-center gap-0.5">
                <span className="w-1 h-1 bg-green-500 rounded-full mr-0.5" />
                Active
              </span>
            ) : (
              <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-150">
                Offline
              </span>
            )}
          </div>

          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <img 
                  src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'} 
                  alt={user.displayName || 'Landlord'} 
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full border border-indigo-200"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-800 truncate" title={user.displayName || ''}>
                    {user.displayName || 'Landlord'}
                  </p>
                  <p className="text-[8px] text-slate-400 font-mono truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <p className="text-[9px] text-indigo-650 leading-tight font-semibold">
                🔒 Protected & auto-saved.
              </p>
              <button
                onClick={handleLogout}
                className="w-full py-0.5 text-center bg-white hover:bg-rose-50 hover:text-rose-600 text-[9px] font-bold text-slate-400 border border-slate-200 rounded-md transition cursor-pointer"
              >
                Disconnect Sync
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[9px] text-slate-500 leading-tight">
                Secure actions in high-speed cloud database.
              </p>
              <button
                onClick={handleLogin}
                className="w-full py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <Database className="w-3 h-3" />
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Responsive horizontal scroll navigation on mobile, true vertical on desktop */}
        <nav className="flex flex-row md:flex-col gap-1 md:gap-2 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none md:flex-1">
          {[
            { name: 'Dashboard', icon: <Layers className="w-4 h-4" /> },
            { name: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
            { 
              name: 'Reminders', 
              icon: <Bell className="w-4 h-4" />, 
              badge: payments.filter(p => p.status !== 'Paid' && p.dueDate <= '2026-06-03').length 
            },
            { name: 'Rooms', icon: <Home className="w-4 h-4" /> },
            { name: 'Guests', icon: <Users className="w-4 h-4" /> },
            { name: 'Ledger', icon: <DollarSign className="w-4 h-4" /> },
            { name: 'Splitter', icon: <Divide className="w-4 h-4" /> },
            { name: 'Business Settings', icon: <Briefcase className="w-4 h-4" /> },
            ...(user && user.email?.toLowerCase() === 'meruvashanmugam9@gmail.com' ? [{ name: 'Platform Admin', icon: <Lock className="w-4 h-4" /> }] : [])
          ].map((tab) => (
            <button
               key={tab.name}
               id={`tab-nav-${tab.name.toLowerCase().replace(/\s+/g, '-')}`}
               onClick={() => setActiveTab(tab.name)}
               className={`flex items-center justify-between px-3 py-1.5 rounded-xl font-semibold text-xs tracking-wide transition-all duration-150 cursor-pointer whitespace-nowrap ${
                 activeTab === tab.name 
                   ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50' 
                   : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
               }`}
            >
              <div className="flex items-center gap-3">
                {tab.icon}
                <span>{tab.name}</span>
              </div>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black leading-none shrink-0 ${
                  activeTab === tab.name 
                    ? 'bg-indigo-650 text-white' 
                    : 'bg-rose-500 text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Info panel in aside */}
        <div className="hidden md:block mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
          <p className="text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-wider">App Builder</p>
          <p className="text-xs text-slate-800">Editing: <span className="font-semibold italic">Guest Tracker v1</span></p>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-10">
          {(subscriptionStatus === 'suspended' || subscriptionStatus === 'unpaid' || subscriptionLedger.some(item => item.status === 'Pending')) && user?.email?.toLowerCase() !== 'meruvashanmugam9@gmail.com' ? (
            <div className="max-w-lg mx-auto my-12 bg-white rounded-3xl border border-rose-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-1 bg-linear-to-r from-red-500 to-rose-600" />
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600 animate-bounce">
                  <span className="text-2xl font-bold">⚠️</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">SaaS Instance Suspended</h2>
                  <p className="text-xs text-rose-500 font-bold uppercase tracking-wider font-mono">
                    {subscriptionLedger.some(item => item.status === 'Pending') ? 'Automatic Payment Lock' : 'Workspace Suspended'}
                  </p>
                </div>
                
                <p className="text-sm text-slate-600 leading-relaxed font-semibold bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  {subscriptionLedger.some(item => item.status === 'Pending') 
                    ? "SaaS Instance Suspended. Premium cloud hosting services for this accommodate are currently locked. Contact administrative support at meruvashanmugam9@gmail.com to proceed."
                    : (suspensionMessage || "SaaS Instance Suspended. Premium cloud hosting services for this accommodate are currently locked. Contact administrative support at meruvashanmugam9@gmail.com to proceed.")
                  }
                </p>

                {subscriptionLedger.some(item => item.status === 'Pending') && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-left space-y-1.5 font-sans">
                    <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <span>⚠️ Unpaid Subscription Months:</span>
                    </p>
                    <div className="divide-y divide-amber-100 max-h-32 overflow-y-auto">
                      {subscriptionLedger.filter(item => item.status === 'Pending').map(item => (
                        <div key={item.id} className="py-1.5 flex items-center justify-between text-xs font-semibold text-amber-700">
                          <span>{item.monthKey}</span>
                          <span>₹{item.amountBilled}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <a 
                    href={`https://wa.me/91${businessConfig?.phone || ''}?text=${encodeURIComponent(`Hello, my PG Owner account with email ${user?.email} is suspended. I cleared the payment. Please activate my EasyStay instance.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    🚀 Clear Dues & Activate Account
                  </a>
                  
                  <p className="text-[10px] text-slate-400">
                    If you paid recently, please message the platform owner or log out below to disconnect synchronization.
                  </p>

                  <button
                    onClick={handleLogout}
                    className="w-full py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Disconnect Sync & Log Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {activeTab === 'Dashboard' && (
                  <Dashboard 
                    rooms={rooms}
                    guests={guests}
                    payments={payments}
                    onQuickPay={handleQuickPay}
                    onNavigateTo={setActiveTab}
                  />
                )}

                {activeTab === 'Analytics' && (
                  <AnalyticsSection 
                    payments={payments}
                    guests={guests}
                    rooms={rooms}
                  />
                )}

                {activeTab === 'Reminders' && (
                  <RemindersSection 
                    payments={payments}
                    guests={guests}
                    rooms={rooms}
                    onQuickPay={handleQuickPay}
                    onUpdatePayment={handleUpdatePayment}
                  />
                )}

                {activeTab === 'Rooms' && (
                  <RoomsSection 
                    rooms={rooms}
                    guests={guests}
                    onAddRoom={handleAddRoom}
                    onUpdateRoom={handleUpdateRoom}
                    onDeleteRoom={handleDeleteRoom}
                  />
                )}

                {activeTab === 'Guests' && (
                  <GuestsSection 
                    guests={guests}
                    rooms={rooms}
                    payments={payments}
                    deletedGuests={deletedGuests}
                    onCheckInGuest={handleCheckInGuest}
                    onUpdateGuest={handleUpdateGuest}
                    onCheckoutGuest={handleCheckoutGuest}
                    onDeleteGuestHistory={handleDeleteGuestHistory}
                    onRestoreGuest={handleRestoreGuest}
                    onPermanentDeleteGuest={handlePermanentDeleteGuest}
                    onAddRoom={handleAddRoom}
                    onUpdateRoom={handleUpdateRoom}
                  />
                )}

                {activeTab === 'Ledger' && (
                  <PaymentsSection 
                    payments={payments}
                    guests={guests}
                    rooms={rooms}
                    onAddPayment={handleAddPayment}
                    onUpdatePayment={handleUpdatePayment}
                    onDeletePayment={handleDeletePayment}
                    businessConfig={businessConfig}
                  />
                )}

                {activeTab === 'Splitter' && (
                  <UtilitySplitter 
                    guests={guests}
                    rooms={rooms}
                    onApplyBills={handleApplyBills}
                  />
                )}

                {activeTab === 'Business Settings' && (
                  <BusinessHub 
                    config={businessConfig}
                    onSaveConfig={handleSaveConfig}
                    subscriptionLedger={subscriptionLedger}
                    subscriptionStatus={subscriptionStatus}
                  />
                )}

                {activeTab === 'Platform Admin' && (
                  <PlatformAdmin />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-200 py-5 px-6 md:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="text-slate-400 font-mono">
              <span>EasyStay v{CLIENT_VERSION} • PG Guest Tracker</span>
            </div>
          </div>
        </footer>

        {/* Dynamic App Remote Update Overlay Modal */}
        {showUpdateModal && appConfig && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/85 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-1 bg-indigo-600" />
              
              <div className="p-8 space-y-6 text-center">
                {/* Visual Header */}
                <div className="w-14 h-14 bg-indigo-55/10 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
                  <Sparkles className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-[10px] uppercase font-bold tracking-wider text-indigo-700">
                    ✨ Premium Update Released
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Update Available (v{appConfig.latestVersion})
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Your Installed Build: v{CLIENT_VERSION}
                  </p>
                </div>

                {appConfig.updateNotes && (
                  <div className="bg-slate-50 p-4 rounded-2xl text-left space-y-1.5 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">📦 What's New:</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-bold">
                      {appConfig.updateNotes}
                    </p>
                  </div>
                )}

                {appConfig.isCritical && (
                  <div className="bg-rose-50 border border-rose-100/60 p-3.5 rounded-2xl flex items-center gap-3 text-left">
                    <div className="p-1.5 bg-rose-550 text-rose-50 rounded-lg shrink-0">
                      <Lock className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-rose-800">Required Upgrade</p>
                      <p className="text-[10px] text-rose-600 leading-normal">This updates database cloud protocols. You must install the newer APK to continue usage.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 pt-2">
                  {appConfig.downloadUrl ? (
                    <a
                      href={appConfig.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      🚀 Install Free Update Now
                    </a>
                  ) : (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-semibold text-center leading-relaxed">
                      Contact support at <strong>meruvashanmugam9@gmail.com</strong> to fetch the download file for this version.
                    </div>
                  )}

                  {!appConfig.isCritical && (
                    <button
                      onClick={() => setShowUpdateModal(false)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition cursor-pointer"
                    >
                      Remind Me Later
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Legacy Database Migration Overlay Modal */}
        {showMigrationModal && legacyMigrateUser && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/85 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-1 bg-amber-500" />
              
              <div className="p-8 space-y-6 text-center">
                {/* Visual Header */}
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 shadow-xs">
                  <RefreshCw className={`w-7 h-7 ${migrationInProgress ? 'animate-spin' : ''}`} />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-[10px] uppercase font-bold tracking-wider text-amber-700">
                    🔄 Legacy Cloud Account Detected
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Import Legacy PG Data & Update Email Owner
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    We detected your active tenant catalog data stored under the legacy mail directory <strong className="text-slate-800 font-bold">{legacyMigrateUser.email}</strong>.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl text-left space-y-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">📦 Directory Payload to Migrate:</p>
                  <ul className="grid grid-cols-2 gap-2 text-xs text-slate-650 font-bold">
                    <li className="flex items-center gap-2 text-slate-650">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {legacyMigrateUser.roomCount || 0} Rooms
                    </li>
                    <li className="flex items-center gap-2 text-slate-650">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {legacyMigrateUser.guestCount || 0} Occupants
                    </li>
                    <li className="col-span-2 flex items-center gap-2 text-slate-650">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Rent Ledger, Utility Calculations & Business Hub Specs
                    </li>
                  </ul>
                  <div className="p-2.5 bg-amber-50/50 rounded-xl text-[11px] text-amber-800 leading-relaxed font-semibold">
                    Confirm moving this directory to your current login <strong className="text-slate-900">{user?.email}</strong>. The old {legacyMigrateUser.email} catalog will be deleted.
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={handleLegacyMigration}
                    disabled={migrationInProgress}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {migrationInProgress ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Synchronizing Secure Cloud Databases...
                      </>
                    ) : (
                      "🚀 Begin Secure Database Migration"
                    )}
                  </button>

                  {!migrationInProgress && (
                    <button
                      onClick={() => setShowMigrationModal(false)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs transition cursor-pointer"
                    >
                      Remind Me Later / Operate Empty Instance
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
