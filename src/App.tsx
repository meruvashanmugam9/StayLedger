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
  Bell
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// Firebase imports
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, deleteDoc, collection, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';

// Type imports
import { 
  Room, 
  Guest, 
  Payment, 
  DeletedGuest,
  INITIAL_ROOMS, 
  INITIAL_GUESTS, 
  INITIAL_PAYMENTS 
} from './types';

// Component imports
import Dashboard from './components/Dashboard';
import RoomsSection from './components/RoomsSection';
import GuestsSection from './components/GuestsSection';
import PaymentsSection from './components/PaymentsSection';
import UtilitySplitter from './components/UtilitySplitter';
import RemindersSection from './components/RemindersSection';

export default function App() {
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

            if (tempRooms.length > 0 || tempGuests.length > 0 || tempPayments.length > 0 || tempDeleted.length > 0) {
              const batch = writeBatch(db);
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
              await batch.commit();
              console.log('Sandbox data migrated to the secure cloud account successfully.');
            }
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
      setIsSyncing(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/deletedGuests`);
    });

    return () => {
      unsubRooms();
      unsubGuests();
      unsubPayments();
      unsubDeletedGuests();
    };
  }, [user]);

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
    if (confirm("Disconnect cloud sync and log out of StayLedger?")) {
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
      
      {/* Side Navigation - StayLedger Aesthetic */}
      <aside className="w-full md:w-65 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col p-6 shrink-0 z-40">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900 leading-tight">StayLedger</h1>
            <span className="text-[9px] font-bold text-indigo-650 tracking-wider uppercase block">Paying Guest Tracker</span>
          </div>
        </div>

        {/* Cloud Persistence & Backup SaaS Status Widget */}
        <div className="mb-6 p-4 rounded-2xl border transition duration-200 bg-linear-to-b from-indigo-50/20 to-indigo-50/40 border-indigo-100 shadow-3xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span>Cloud Engine</span>
            </span>
            {authLoading ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            ) : user ? (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-green-50 text-green-700 border border-green-150 flex items-center gap-0.5">
                <span className="w-1 h-1 bg-green-500 rounded-full mr-0.5" />
                Active
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-150">
                Offline
              </span>
            )}
          </div>

          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img 
                  src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'} 
                  alt={user.displayName || 'Landlord'} 
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full border border-indigo-200"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate" title={user.displayName || ''}>
                    {user.displayName || 'Landlord'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-indigo-650 leading-relaxed font-semibold">
                🔒 Power Off Proof. All actions auto-saved in cloud.
              </p>
              <button
                onClick={handleLogout}
                className="w-full py-1 text-center bg-white hover:bg-rose-50 hover:text-rose-600 text-[10px] font-bold text-slate-500 border border-slate-200 rounded-lg transition"
              >
                Disconnect Sync
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                If the device powers off, local data is vulnerable. Sync to secure cloud database.
              </p>
              <button
                onClick={handleLogin}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Responsive horizontal scroll navigation on mobile, true vertical on desktop */}
        <nav className="flex flex-row md:flex-col gap-1 md:gap-2 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none md:flex-1">
          {[
            { name: 'Dashboard', icon: <Layers className="w-4 h-4" /> },
            { 
              name: 'Reminders', 
              icon: <Bell className="w-4 h-4" />, 
              badge: payments.filter(p => p.status !== 'Paid' && p.dueDate <= '2026-06-03').length 
            },
            { name: 'Rooms', icon: <Home className="w-4 h-4" /> },
            { name: 'Guests', icon: <Users className="w-4 h-4" /> },
            { name: 'Ledger', icon: <DollarSign className="w-4 h-4" /> },
            { name: 'Splitter', icon: <Divide className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.name}
              id={`tab-nav-${tab.name.toLowerCase()}`}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all duration-150 cursor-pointer whitespace-nowrap ${
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
                />
              )}

              {activeTab === 'Splitter' && (
                <UtilitySplitter 
                  guests={guests}
                  rooms={rooms}
                  onApplyBills={handleApplyBills}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-200 py-5 px-6 md:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="text-slate-400 font-mono">
              <span>StayLedger v1.0 • PG Guest Tracker</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
