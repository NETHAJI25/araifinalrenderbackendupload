// User model - Firebase Realtime Database doesn't require explicit model definitions
// This file serves as documentation for the user data structure

/**
 * User Data Structure:
 * {
 *   id: string (UUID),
 *   name: string,
 *   email: string (unique, lowercase),
 *   password: string (hashed),
 *   phone: string,
 *   college: string,
 *   course: string,
 *   year: string,
 *   city: string,
 *   state: string,
 *   country: string (default: 'India'),
 *   profileCompleted: boolean,
 *   paymentStatus: string ('pending' | 'paid'),
 *   teamId: string (nullable, references Team.teamId),
 *   role: string ('admin' | 'participant'),
 *   linkedin: string (nullable),
 *   github: string (nullable),
 *   createdAt: string (ISO date)
 * }
 */

module.exports = {};