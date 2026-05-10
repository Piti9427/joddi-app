import React from 'react';
import {
  Coffee, Utensils, Car, Bus, Home, PlugZap, Receipt, ShoppingBag, ShoppingCart,
  Shirt, Wallet, Banknote, CircleDollarSign, HandCoins, TrendingUp, Briefcase,
  Shield, Gift, Gamepad2, Music, Plane, Camera, Trophy, Star, HeartPulse,
  Activity, GraduationCap, Baby, Dog, Users, Smartphone, Wifi, Zap, Key,
  Hammer, Scissors, Tag, Sparkles
} from 'lucide-react';

export const ICON_OPTIONS = [
  { name: 'Coffee', icon: <Coffee size={20} /> },
  { name: 'Utensils', icon: <Utensils size={20} /> },
  { name: 'Car', icon: <Car size={20} /> },
  { name: 'Bus', icon: <Bus size={20} /> },
  { name: 'Home', icon: <Home size={20} /> },
  { name: 'PlugZap', icon: <PlugZap size={20} /> },
  { name: 'Receipt', icon: <Receipt size={20} /> },
  { name: 'ShoppingBag', icon: <ShoppingBag size={20} /> },
  { name: 'ShoppingCart', icon: <ShoppingCart size={20} /> },
  { name: 'Shirt', icon: <Shirt size={20} /> },
  { name: 'Wallet', icon: <Wallet size={20} /> },
  { name: 'Banknote', icon: <Banknote size={20} /> },
  { name: 'CircleDollarSign', icon: <CircleDollarSign size={20} /> },
  { name: 'HandCoins', icon: <HandCoins size={20} /> },
  { name: 'TrendingUp', icon: <TrendingUp size={20} /> },
  { name: 'Briefcase', icon: <Briefcase size={20} /> },
  { name: 'Shield', icon: <Shield size={20} /> },
  { name: 'Gift', icon: <Gift size={20} /> },
  { name: 'Gamepad2', icon: <Gamepad2 size={20} /> },
  { name: 'Music', icon: <Music size={20} /> },
  { name: 'Plane', icon: <Plane size={20} /> },
  { name: 'Camera', icon: <Camera size={20} /> },
  { name: 'Trophy', icon: <Trophy size={20} /> },
  { name: 'Star', icon: <Star size={20} /> },
  { name: 'HeartPulse', icon: <HeartPulse size={20} /> },
  { name: 'Activity', icon: <Activity size={20} /> },
  { name: 'GraduationCap', icon: <GraduationCap size={20} /> },
  { name: 'Baby', icon: <Baby size={20} /> },
  { name: 'Dog', icon: <Dog size={20} /> },
  { name: 'Users', icon: <Users size={20} /> },
  { name: 'Smartphone', icon: <Smartphone size={20} /> },
  { name: 'Wifi', icon: <Wifi size={20} /> },
  { name: 'Zap', icon: <Zap size={20} /> },
  { name: 'Key', icon: <Key size={20} /> },
  { name: 'Hammer', icon: <Hammer size={20} /> },
  { name: 'Scissors', icon: <Scissors size={20} /> },
  { name: 'Tag', icon: <Tag size={20} /> },
  { name: 'Sparkles', icon: <Sparkles size={20} /> },
];

export const ICONS: Record<string, React.ReactNode> = ICON_OPTIONS.reduce(
  (acc, opt) => ({
    ...acc,
    [opt.name]: opt.icon,
  }),
  {},
);

export const COLOR_OPTIONS = [
  { name: 'Rose', bg: 'bg-rose-500', text: 'text-rose-500 dark:text-rose-400' },
  { name: 'Pink', bg: 'bg-pink-500', text: 'text-pink-500 dark:text-pink-400' },
  { name: 'Fuchsia', bg: 'bg-fuchsia-500', text: 'text-fuchsia-500 dark:text-fuchsia-400' },
  { name: 'Purple', bg: 'bg-purple-500', text: 'text-purple-500 dark:text-purple-400' },
  { name: 'Violet', bg: 'bg-violet-500', text: 'text-violet-500 dark:text-violet-400' },
  { name: 'Indigo', bg: 'bg-indigo-500', text: 'text-indigo-500 dark:text-indigo-400' },
  { name: 'Blue', bg: 'bg-blue-500', text: 'text-blue-500 dark:text-blue-400' },
  { name: 'Sky', bg: 'bg-sky-500', text: 'text-sky-500 dark:text-sky-400' },
  { name: 'Cyan', bg: 'bg-cyan-500', text: 'text-cyan-500 dark:text-cyan-400' },
  { name: 'Teal', bg: 'bg-teal-500', text: 'text-teal-500 dark:text-teal-400' },
  { name: 'Emerald', bg: 'bg-emerald-500', text: 'text-emerald-500 dark:text-emerald-400' },
  { name: 'Green', bg: 'bg-green-500', text: 'text-green-500 dark:text-green-400' },
  { name: 'Lime', bg: 'bg-lime-500', text: 'text-lime-500 dark:text-lime-400' },
  { name: 'Yellow', bg: 'bg-yellow-500', text: 'text-yellow-500 dark:text-yellow-400' },
  { name: 'Amber', bg: 'bg-amber-500', text: 'text-amber-500 dark:text-amber-400' },
  { name: 'Orange', bg: 'bg-orange-500', text: 'text-orange-500 dark:text-orange-400' },
];

export const isHex = (c: string) => c && c.startsWith('#');

export function getCategoryColorStyles(color: string) {
  if (isHex(color)) {
    return {
      style: { color: color, backgroundColor: `${color}1a` },
      className: '',
    };
  }
  return {
    style: {},
    className: color || 'text-secondary',
  };
}
