import { AcknowledgmentEntry, ConsignorNoteEntry, InvoiceEntry, User } from '../types';

const KEYS = {
  USER: 'darbe_logistics_user',
  ACKNOWLEDGMENTS: 'darbe_logistics_acknowledgments',
  CONSIGNOR_NOTES: 'darbe_logistics_consignor_notes',
  INVOICES: 'darbe_logistics_invoices',
  REGISTERED_USERS: 'darbe_logistics_registered_users'
};

export const storage = {
  // Current session user
  setUser: (user: User | null) => {
    if (user) localStorage.setItem(KEYS.USER, JSON.stringify(user));
    else localStorage.removeItem(KEYS.USER);
  },
  getUser: (): User | null => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  // Registered users persistence
  saveRegisteredUser: (user: User, password: string) => {
    const users = storage.getRegisteredUsers();
    // In a real app we'd hash this, but we'll store it simply for this prototype
    const newUser = { ...user, password };
    localStorage.setItem(KEYS.REGISTERED_USERS, JSON.stringify([...users, newUser]));
  },
  getRegisteredUsers: (): any[] => {
    const data = localStorage.getItem(KEYS.REGISTERED_USERS);
    return data ? JSON.parse(data) : [];
  },
  verifyUser: (email: string, password: string): User | null => {
    const users = storage.getRegisteredUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return null;
    const { password: _, ...userWithoutPassword } = found;
    return userWithoutPassword as User;
  },

  updateRegisteredUser: (updatedUser: User) => {
    const users = storage.getRegisteredUsers();
    const newUsers = users.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u);
    localStorage.setItem(KEYS.REGISTERED_USERS, JSON.stringify(newUsers));
  },
  deleteRegisteredUser: (userId: string) => {
    const users = storage.getRegisteredUsers();
    const newUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(KEYS.REGISTERED_USERS, JSON.stringify(newUsers));
  },
  saveAcknowledgment: (entry: AcknowledgmentEntry) => {
    const existing = storage.getAcknowledgments();
    localStorage.setItem(KEYS.ACKNOWLEDGMENTS, JSON.stringify([entry, ...existing]));
  },
  getAcknowledgments: (): AcknowledgmentEntry[] => {
    const data = localStorage.getItem(KEYS.ACKNOWLEDGMENTS);
    return data ? JSON.parse(data) : [];
  },

  saveConsignorNote: (entry: ConsignorNoteEntry) => {
    const existing = storage.getConsignorNotes();
    localStorage.setItem(KEYS.CONSIGNOR_NOTES, JSON.stringify([entry, ...existing]));
  },
  getConsignorNotes: (): ConsignorNoteEntry[] => {
    const data = localStorage.getItem(KEYS.CONSIGNOR_NOTES);
    return data ? JSON.parse(data) : [];
  },

  saveInvoice: (entry: InvoiceEntry) => {
    const existing = storage.getInvoices();
    localStorage.setItem(KEYS.INVOICES, JSON.stringify([entry, ...existing]));
  },
  getInvoices: (): InvoiceEntry[] => {
    const data = localStorage.getItem(KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  },

  updateAcknowledgment: (entry: AcknowledgmentEntry) => {
    const existing = storage.getAcknowledgments();
    const updated = existing.map(e => e.id === entry.id ? entry : e);
    localStorage.setItem(KEYS.ACKNOWLEDGMENTS, JSON.stringify(updated));
  },
  updateConsignorNote: (entry: ConsignorNoteEntry) => {
    const existing = storage.getConsignorNotes();
    const updated = existing.map(e => e.id === entry.id ? entry : e);
    localStorage.setItem(KEYS.CONSIGNOR_NOTES, JSON.stringify(updated));
  },
  updateInvoice: (entry: InvoiceEntry) => {
    const existing = storage.getInvoices();
    const updated = existing.map(e => e.id === entry.id ? entry : e);
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(updated));
  }
};
