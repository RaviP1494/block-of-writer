import { createStore } from 'solid-js/store';


export interface Flash {
  id: number; 
  createDT: number; 
  textContents: string;
  tSpan: number; 
  delayTSpan: number; 
}

export interface Flicker {
  id: number; // Negative integer
  createDT: number;
  contentIDs: number[]; // Array of positive Spurt IDs
  delayTSpan: number;
}

export interface Stream {
  id: number;
  title: string;
  createDT: number;
  contentIDs: number[]; // Positive for Spurts, Negative for Bursts
}

