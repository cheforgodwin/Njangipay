import { db } from '../config/firebase';
import { doc, runTransaction, collection, serverTimestamp, increment, query, where, getDocs, limit, addDoc } from 'firebase/firestore';

/**
 * Atomically process a Njangi contribution.
 */
export const processContribution = async (userId, groupId, amount, type = 'contribution') => {
  try {
    await runTransaction(db, async (transaction) => {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await transaction.get(groupRef);

      if (!groupSnap.exists()) {
        throw new Error("Group does not exist!");
      }

      const userRef = doc(db, "users", userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error("User record not found.");

      // Atomic updates
      transaction.update(groupRef, {
        totalFund: increment(amount),
        lastActivity: serverTimestamp()
      });

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

      transaction.update(userRef, {
        balance: increment(-amount)
      });
    });

    console.log("Contribution successful!");
    return { success: true };
  } catch (error) {
    console.error("Contribution failed: ", error);
    return { success: false, error: error.message };
  }
};

/**
 * Atomically process a P2P transfer between users.
 */
export const processTransfer = async (senderUid, recipientShortId, amount) => {
  try {
    // 1. Find the recipient by short ID (first 8 chars of UID)
    // In a real app, we'd have a 'shortId' field indexed. 
    // Here we'll search for users where UID starts with the provided ID.
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("uid", ">=", recipientShortId), where("uid", "<=", recipientShortId + "\uf8ff"), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Recipient account not found.");
    }

    const recipientDoc = querySnapshot.docs[0];
    const recipientUid = recipientDoc.data().uid;
    const recipientDocId = recipientDoc.id;

    if (recipientUid === senderUid) {
      throw new Error("You cannot transfer to yourself.");
    }

    await runTransaction(db, async (transaction) => {
      // Get sender details
      const senderQuery = query(collection(db, "users"), where("uid", "==", senderUid), limit(1));
      const senderSnapArr = await getDocs(senderQuery);
      if (senderSnapArr.empty) throw new Error("Sender not found.");
      const senderDoc = senderSnapArr.docs[0];
      const senderRef = doc(db, "users", senderDoc.id);

      const senderData = (await transaction.get(senderRef)).data();
      if (senderData.balance < amount) {
        throw new Error("Insufficient balance.");
      }

      const recipientRef = doc(db, "users", recipientDocId);

      // Perform updates
      transaction.update(senderRef, { balance: increment(-amount) });
      transaction.update(recipientRef, { balance: increment(amount) });

      // Log both sides
      const senderTxnRef = doc(collection(db, "transactions"));
      transaction.set(senderTxnRef, {
        user_id: senderUid,
        amount: amount,
        type: "transfer_out",
        title: `Transfer to NP-${recipientShortId}`,
        timestamp: serverTimestamp(),
        status: "completed"
      });

      const recipientTxnRef = doc(collection(db, "transactions"));
      transaction.set(recipientTxnRef, {
        user_id: recipientUid,
        amount: amount,
        type: "transfer_in",
        title: `Received from NP-${senderUid.substring(0,8).toUpperCase()}`,
        timestamp: serverTimestamp(),
        status: "completed"
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Transfer error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Atomically process loan funding in Marketplace.
 */
export const processLoanFunding = async (funderUid, loanRequest) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get Funder User Doc
      const funderQuery = query(collection(db, "users"), where("uid", "==", funderUid), limit(1));
      const funderSnapArr = await getDocs(funderQuery);
      if (funderSnapArr.empty) throw new Error("Funder not found.");
      const funderDoc = funderSnapArr.docs[0];
      const funderRef = doc(db, "users", funderDoc.id);
      
      const funderData = (await transaction.get(funderRef)).data();
      if (funderData.balance < loanRequest.amount) {
        throw new Error("Insufficient balance to fund this loan.");
      }

      // 2. Get Borrower User Doc
      const borrowerQuery = query(collection(db, "users"), where("uid", "==", loanRequest.user_id), limit(1));
      const borrowerSnapArr = await getDocs(borrowerQuery);
      if (borrowerSnapArr.empty) throw new Error("Borrower user record not found.");
      const borrowerDoc = borrowerSnapArr.docs[0];
      const borrowerRef = doc(db, "users", borrowerDoc.id);

      // 3. Update Loan Request
      const loanRef = doc(db, "loan_requests", loanRequest.id);
      transaction.update(loanRef, {
        status: 'funded',
        fundedBy: funderUid,
        fundedAt: serverTimestamp()
      });

      // 4. Update Balances
      transaction.update(funderRef, { balance: increment(-loanRequest.amount) });
      transaction.update(borrowerRef, { balance: increment(loanRequest.amount) });

      // 5. Log Transactions
      const funderTxnRef = doc(collection(db, "transactions"));
      transaction.set(funderTxnRef, {
        user_id: funderUid,
        amount: loanRequest.amount,
        type: "loan_funding",
        title: `Funded Loan for ${loanRequest.user}`,
        timestamp: serverTimestamp(),
        status: "completed"
      });

      const borrowerTxnRef = doc(collection(db, "transactions"));
      transaction.set(borrowerTxnRef, {
        user_id: loanRequest.user_id,
        amount: loanRequest.amount,
        type: "loan_disbursement",
        title: `Loan Received (Marketplace)`,
        timestamp: serverTimestamp(),
        status: "completed"
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Loan funding error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Atomically process loan repayment.
 */
export const processLoanRepayment = async (borrowerUid, loanRequest) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get Borrower User Doc
      const borrowerQuery = query(collection(db, "users"), where("uid", "==", borrowerUid), limit(1));
      const borrowerSnapArr = await getDocs(borrowerQuery);
      if (borrowerSnapArr.empty) throw new Error("Borrower not found.");
      const borrowerDoc = borrowerSnapArr.docs[0];
      const borrowerRef = doc(db, "users", borrowerDoc.id);
      
      const borrowerData = (await transaction.get(borrowerRef)).data();
      const interestRate = parseInt(loanRequest.interest) || 5;
      const interestAmount = (loanRequest.amount * interestRate) / 100;
      const totalRepayment = loanRequest.amount + interestAmount;

      if (borrowerData.balance < totalRepayment) {
        throw new Error("Insufficient balance for repayment.");
      }

      // 2. Get Funder (Lender) User Doc
      const funderQuery = query(collection(db, "users"), where("uid", "==", loanRequest.fundedBy), limit(1));
      const funderSnapArr = await getDocs(funderQuery);
      if (funderSnapArr.empty) throw new Error("Lender user record not found.");
      const funderDoc = funderSnapArr.docs[0];
      const funderRef = doc(db, "users", funderDoc.id);

      // 3. Update Loan Request
      const loanRef = doc(db, "loan_requests", loanRequest.id);
      transaction.update(loanRef, {
        status: 'repaid',
        repaidAt: serverTimestamp()
      });

      // 4. Update Balances
      transaction.update(borrowerRef, { balance: increment(-totalRepayment) });
      transaction.update(funderRef, { balance: increment(totalRepayment) });

      // 5. Log Transactions
      const borrowerTxnRef = doc(collection(db, "transactions"));
      transaction.set(borrowerTxnRef, {
        user_id: borrowerUid,
        amount: totalRepayment,
        type: "loan_repayment",
        title: `Loan Repayment (${loanRequest.purpose || 'Marketplace Loan'})`,
        timestamp: serverTimestamp(),
        status: "completed"
      });

      const funderTxnRef = doc(collection(db, "transactions"));
      transaction.set(funderTxnRef, {
        user_id: loanRequest.fundedBy,
        amount: totalRepayment,
        type: "loan_collection",
        title: `Repayment Received from ${loanRequest.user}`,
        timestamp: serverTimestamp(),
        status: "completed"
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Loan repayment error:", error);
    return { success: false, error: error.message };
  }
};
