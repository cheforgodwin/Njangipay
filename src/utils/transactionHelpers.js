import { db } from '../config/firebase';
import { doc, runTransaction, collection, serverTimestamp, increment } from 'firebase/firestore';

/**
 * Atomically process a Njangi contribution.
 * This ensures that the transaction log is created AND the group balance is updated together.
 * @param {string} userId - ID of the member contributing
 * @param {string} groupId - ID of the Njangi group
 * @param {number} amount - Amount in XAF
 * @param {string} type - 'contribution' or 'loan_repayment'
 */
export const processContribution = async (userId, groupId, amount, type = 'contribution') => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Reference the Group document
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await transaction.get(groupRef);

      if (!groupSnap.exists()) {
        throw new Error("Group does not exist!");
      }

      // 2. Reference the user's wallet (optional, if deducting from wallet)
      const userRef = doc(db, "users", userId);

      // 3. Perform the atomic updates
      // A. Update Group Total Fund
      transaction.update(groupRef, {
        totalFund: increment(amount),
        lastActivity: serverTimestamp()
      });

      // B. Create the transaction log entry
      const newTxnRef = doc(collection(db, "transactions"));
      transaction.set(newTxnRef, {
        user_id: userId,
        group_id: groupId,
        amount: amount,
        type: type,
        title: type === 'contribution' ? 'Njangi Contribution' : 'Loan Repayment',
        status: 'Paid',
        timestamp: serverTimestamp()
      });

      // C. (Optional) Deduct from user's personal wallet balance
      transaction.update(userRef, {
        balance: increment(-amount)
      });
    });

    console.log("Atomic transaction successful!");
    return { success: true };
  } catch (error) {
    console.error("Atomic transaction failed: ", error);
    return { success: false, error: error.message };
  }
};
