import { getFirestore } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

class UserController {
  constructor() {
    this.db = getFirestore();
  }

  /**
   * Remove duplicate user documents that share the same email.
   * Keeps the currently authenticated user's document (or the first found doc)
   */
  dedupeUserProfiles = async (req, res) => {
    try {
      const email = (req.body.email || req.user?.email || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const snapshot = await this.db.collection('users')
        .where('email', '==', email)
        .get();

      if (snapshot.empty) {
        return res.json({
          success: true,
          message: 'No user documents found for the provided email',
          removed: 0
        });
      }

      const docs = snapshot.docs;
      const keepDoc = docs.find(doc => doc.id === req.user.uid) || docs[0];
      const duplicates = docs.filter(doc => doc.id !== keepDoc.id);

      if (duplicates.length === 0) {
        return res.json({
          success: true,
          message: 'No duplicate documents detected',
          removed: 0
        });
      }

      await Promise.all(duplicates.map(doc => doc.ref.delete()));

      logger.info(`Deduped ${duplicates.length} user docs for email ${email}. Keeping doc ${keepDoc.id}`);

      return res.json({
        success: true,
        removed: duplicates.length,
        kept: keepDoc.id
      });
    } catch (error) {
      logger.error('Error deduping user documents:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to dedupe user documents'
      });
    }
  };
}

export default new UserController();

