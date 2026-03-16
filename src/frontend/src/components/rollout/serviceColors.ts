/**
 * Service color utilities for consistent service-based coloring
 */

/**
 * Predefined colors for services - provides visual distinction
 */
export const SERVICE_COLORS = [
  { bg: '#0891b2', text: '#ffffff' }, // cyan
  { bg: '#db2777', text: '#ffffff' }, // pink
  { bg: '#059669', text: '#ffffff' }, // emerald
  { bg: '#7c3aed', text: '#ffffff' }, // purple
  { bg: '#ea580c', text: '#ffffff' }, // orange
  { bg: '#2563eb', text: '#ffffff' }, // blue
  { bg: '#c2410c', text: '#ffffff' }, // orange-red
  { bg: '#4f46e5', text: '#ffffff' }, // indigo
  { bg: '#0d9488', text: '#ffffff' }, // teal
  { bg: '#b91c1c', text: '#ffffff' }, // red
  { bg: '#7c3aed', text: '#ffffff' }, // violet
  { bg: '#0369a1', text: '#ffffff' }, // sky
  { bg: '#a16207', text: '#ffffff' }, // amber
  { bg: '#15803d', text: '#ffffff' }, // green
  { bg: '#be185d', text: '#ffffff' }, // pink
];

/**
 * Get a consistent color for a service based on its ID
 */
export const getServiceColor = (serviceId: number) =>
  SERVICE_COLORS[serviceId % SERVICE_COLORS.length];
