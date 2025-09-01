// Valid cities in Andhra Pradesh
export const VALID_CITIES = [
  'vijayawada',
  'guntur',
  'visakhapatnam',
  'tirupati',
  'kakinada',
  'nellore',
  'kurnool',
  'rajahmundry',
  'kadapa',
  'anantapur',
  'kalasalingam academy of research and education',
  'krishnan koil',
  'srivilliputtur',
  'rajapalayam',
  'virudhunagar'
];

// Valid initiatives
export const INITIATIVES = {
  ANNAMITRA_SEVA: 'annamitra-seva',
  VIDYA_JYOTHI: 'vidya-jyothi',
  SURAKSHA_SETU: 'suraksha-setu',
  PUNARASHA: 'punarasha',
  RAKSHA_JYOTHI: 'raksha-jyothi',
  JYOTHI_NILAYAM: 'jyothi-nilayam'
};

// Status workflow stages
export const STATUS_STAGES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PICKED: 'picked',
  DELIVERED: 'delivered'
};

// Valid status transitions
export const VALID_TRANSITIONS = {
  [STATUS_STAGES.PENDING]: [STATUS_STAGES.ACCEPTED],
  [STATUS_STAGES.ACCEPTED]: [STATUS_STAGES.PICKED],
  [STATUS_STAGES.PICKED]: [STATUS_STAGES.DELIVERED],
  [STATUS_STAGES.DELIVERED]: [] // Final state
};

// User types
export const USER_TYPES = {
  VOLUNTEER: 'volunteer',
  DONOR: 'donor',
  COMMUNITY: 'community',
  ADMIN: 'admin'
};

// Notification types
export const NOTIFICATION_TYPES = {
  NEW_DONATION: 'new_donation',
  DONATION_ACCEPTED: 'donation_accepted',
  DONATION_PICKED: 'donation_picked',
  DONATION_DELIVERED: 'donation_delivered',
  NEW_REQUEST: 'new_request',
  REQUEST_FULFILLED: 'request_fulfilled',
  COMMUNITY_REQUEST_CLAIMED: 'community_request_claimed',
  NEW_COMMUNITY_REQUEST: 'new_community_request'
};

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  DONATIONS: 'donations',
  REQUESTS: 'community_requests',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs'
};

// Motivational messages
export const MOTIVATIONAL_MESSAGES = [
  "Your donation fed {count} families in {location} today! 🍛",
  "Because of you, {count} children will sleep with full stomachs tonight 😊",
  "Hunger ends where kindness begins - thank you for making a difference! ❤️",
  "You've created ripples of hope in {location} - {count} people are grateful! 🙏",
  "Your generosity just changed {count} lives in {location}! ✨",
  "A simple act of kindness helped {count} people today - you're amazing! 🌟",
  "Your donation brought smiles to {count} faces in {location}! 😊",
  "Thanks to you, {count} families won't go hungry tonight! 🏠"
];

export default {
  VALID_CITIES,
  INITIATIVES,
  STATUS_STAGES,
  VALID_TRANSITIONS,
  USER_TYPES,
  NOTIFICATION_TYPES,
  COLLECTIONS,
  MOTIVATIONAL_MESSAGES
};