// Team model - Firebase Realtime Database doesn't require explicit model definitions
// This file serves as documentation for the team data structure

/**
 * Team Data Structure:
 * {
 *   id: string (UUID),
 *   teamId: string (unique IA26- format),
 *   teamName: string,
 *   leaderId: string (references User.id),
 *   problemStatementId: string (nullable),
 *   problemStatementTitle: string (nullable),
 *   members: Array<{
 *     userId: string (references User.id),
 *     name: string,
 *     college: string,
 *     role: string ('Team Leader' | 'Member'),
 *     paymentStatus: string ('pending' | 'paid'),
 *     profileCompleted: boolean,
 *     joinedAt: string (ISO date)
 *   }>,
 *   status: string ('active' | 'complete' | 'rejected'),
 *   confirmationStatus: string ('pending' | 'confirmed'),
 *   rejectionReason: string (nullable),
 *   createdAt: string (ISO date),
 *   updatedAt: string (ISO date)
 * }
 */

module.exports = {};