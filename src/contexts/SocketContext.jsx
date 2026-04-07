import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
 return useContext(SocketContext);
};

// Generate a short notification beep via Web Audio API (no file needed)
const playBeep = () => {
 try {
 const ctx = new (window.AudioContext || window.webkitAudioContext)();
 const oscillator = ctx.createOscillator();
 const gainNode = ctx.createGain();

 oscillator.connect(gainNode);
 gainNode.connect(ctx.destination);

 oscillator.type = 'sine';
 oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
 oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1); // C#6

 gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
 gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

 oscillator.start(ctx.currentTime);
 oscillator.stop(ctx.currentTime + 0.4);

 // Also try mp3 file if available
 const audio = new Audio('/sounds/notification.mp3');
 audio.volume = 0.5;
 audio.play().catch(() => { }); // Silently fail if mp3 not available
 } catch (err) {
 // Audio not supported
 }
};

export const SocketProvider = ({ children }) => {
 const { user, isAuthenticated } = useAuth();
 const [socket, setSocket] = useState(null);
 const queryClient = useQueryClient();
 const socketRef = useRef(null);

 const playNotificationSound = useCallback(() => {
 playBeep();
 }, []);

 useEffect(() => {
 const token = localStorage.getItem('token');

 if (!isAuthenticated || !user || !token) {
 if (socketRef.current) {
 socketRef.current.disconnect();
 socketRef.current = null;
 setSocket(null);
 }
 return;
 }

 // Use base URL without /api/v1 for socket
 const socketUrl = import.meta.env.DEV
 ? `http://${window.location.hostname}:5000`
 : (import.meta.env.VITE_SOCKET_URL || 'https://edu-live-99hc.onrender.com');

 const newSocket = io(socketUrl, {
 auth: { token },
 transports: ['websocket', 'polling'],
 reconnectionAttempts: 5,
 reconnectionDelay: 2000,
 });

 socketRef.current = newSocket;
 setSocket(newSocket);

 newSocket.on('connect', () => {
 console.log('🔌 Socket connected');
 });

 newSocket.on('connect_error', (err) => {
 console.warn('Socket connect error:', err.message);
 });

 // Listen for generic notifications
 newSocket.on('notification', (data) => {
 playBeep();

 // Refresh notification queries
 queryClient.invalidateQueries({ queryKey: ['notifications'] });
 queryClient.invalidateQueries({ queryKey: ['campusHubUnreadCount'] });

 if (data.type === 'campus_hub_order_new') {
 toast.success('🛒 New Service Request!', { duration: 5000, id: 'new-order' });
 queryClient.invalidateQueries({ queryKey: ['campusHubOrders'] });
 } else if (data.type === 'campus_hub_order_status') {
 toast('🔄 Order status updated', { icon: '📦', duration: 4000 });
 queryClient.invalidateQueries({ queryKey: ['campusHubOrders'] });
 } else if (data.type === 'campus_hub_application') {
 if (data.action === 'approve') {
 toast.success('🎉 Application Approved! You are now a provider.', { duration: 6000 });
 } else {
 toast.error('Application status updated', { duration: 4000 });
 }
 queryClient.invalidateQueries({ queryKey: ['campusHubMyApplication'] });
 } else if (data.type === 'campus_hub_message') {
 toast('💬 New message received', { duration: 3000 });
 queryClient.invalidateQueries({ queryKey: ['campusHubUnreadCount'] });
 }
 });

 // Listen for real-time chat messages
 newSocket.on('new_chat_message', (message) => {
 playBeep();
 if (message?.order) {
 queryClient.invalidateQueries({ queryKey: ['campusHubChatMessages', message.order] });
 }
 queryClient.invalidateQueries({ queryKey: ['campusHubUnreadCount'] });
 });

 return () => {
 newSocket.disconnect();
 socketRef.current = null;
 };
 }, [isAuthenticated, user?._id, queryClient]);

 return (
 <SocketContext.Provider value={{ socket, playNotificationSound }}>
 {children}
 </SocketContext.Provider>
 );
};
