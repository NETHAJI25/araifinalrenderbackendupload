/**
 * Generate unique IDs for various entities
 */

/**
 * Generate Team ID in IA26- format
 * @returns {string} Team ID like IA26-ABCD
 */
const generateTeamId = () => {
  const prefix = 'IA26-';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + result;
};

/**
 * Generate Submission ID
 * @returns {string} Submission ID like SUB-XXXXX
 */
const generateSubmissionId = () => {
  const prefix = 'SUB-';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + result;
};

module.exports = {
  generateTeamId,
  generateSubmissionId
};